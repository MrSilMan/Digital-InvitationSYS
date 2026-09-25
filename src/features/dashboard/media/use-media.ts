'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { editor } from '@/i18n/pt-AO';
import {
  fileMimeType,
  isSingleMediaType,
  type MediaType,
  UPLOAD_RULES,
  uploadProblem,
} from '@/lib/media/rules';
import { fillTemplate } from '@/lib/template';

import {
  confirmUpload,
  listMedia,
  removeMedia,
  reorderMedia,
  requestUpload,
  retryProcessing,
  saveAltText,
} from './actions';
import type { MediaErrorCode, MediaItem } from './types';

const t = editor.media;
/** How often the tab asks for news while files are being processed. */
const POLL_MS = 2_500;
const MB = 1024 * 1024;

/** A file on its way to storage (`mediaId` once the server has created its media). */
export interface UploadInProgress {
  localId: string;
  type: MediaType;
  mediaId: string | null;
  /** 0 to 1. */
  progress: number;
}

export function mediaErrorText(code: MediaErrorCode, type: MediaType): string {
  switch (code) {
    case 'type':
      return type === 'MUSIC' ? t.errors.type.audio : t.errors.type.image;
    case 'size':
      return fillTemplate(t.errors.size, { max: String(UPLOAD_RULES[type].maxBytes / MB) });
    case 'empty':
      return t.errors.empty;
    case 'limit':
      return t.errors.limit;
    case 'missing':
      return t.failures.missing;
    case 'rate-limited':
      return t.errors.rateLimited;
    case 'unauthenticated':
      return t.errors.unauthenticated;
    case 'not-found':
      return t.errors.notFound;
    case 'invalid':
      return t.errors.invalid;
    case 'unavailable':
      return t.errors.unavailable;
  }
}

/** PUT to the presigned URL, reporting progress. True when storage accepted the file. */
function putFile(
  upload: { url: string; headers: Record<string, string> },
  file: File,
  onProgress: (fraction: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open('PUT', upload.url);
    for (const [name, value] of Object.entries(upload.headers)) {
      request.setRequestHeader(name, value);
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
    };
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.onabort = () => resolve(false);
    request.send(file);
  });
}

/**
 * State of the "Multimédia" tab: the event's media as the server knows them, uploads in progress
 * and one error message per type. `onPublished` runs whenever what guests see changes (a file
 * became ready, was removed, moved or described), to refresh the preview.
 */
export function useMedia(eventId: string, initialItems: MediaItem[], onPublished: () => void) {
  const [items, setItems] = useState(initialItems);
  const [uploads, setUploads] = useState<UploadInProgress[]>([]);
  const [errors, setErrors] = useState<Partial<Record<MediaType, string>>>({});

  const setError = useCallback((type: MediaType, message: string | undefined) => {
    setErrors((current) => ({ ...current, [type]: message }));
  }, []);

  const replaceItem = useCallback((media: MediaItem) => {
    setItems((current) => current.map((item) => (item.id === media.id ? media : item)));
  }, []);

  // While something is being processed, ask the server for news.
  const processing = items.some((item) => item.status === 'PENDING');
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => {
      listMedia(eventId)
        .then((result) => {
          if (result.ok) setItems(result.items);
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [eventId, processing]);

  // What guests see: the ready files, in order, with their descriptions.
  const publishedKey = useMemo(
    () =>
      items
        .filter((item) => item.status === 'READY')
        .map((item) => `${item.id}:${item.altText}`)
        .join('|'),
    [items],
  );
  const lastPublishedKey = useRef(publishedKey);
  useEffect(() => {
    if (lastPublishedKey.current === publishedKey) return;
    lastPublishedKey.current = publishedKey;
    onPublished();
  }, [publishedKey, onPublished]);

  const uploadFile = async (type: MediaType, file: File) => {
    const mimeType = fileMimeType(file);
    const problem = uploadProblem(type, { mimeType, size: file.size });
    if (problem) {
      setError(type, mediaErrorText(problem, type));
      return;
    }
    const localId = crypto.randomUUID();
    const track = (change: Partial<UploadInProgress>) =>
      setUploads((current) =>
        current.map((upload) => (upload.localId === localId ? { ...upload, ...change } : upload)),
      );
    setUploads((current) => [...current, { localId, type, mediaId: null, progress: 0 }]);
    try {
      const requested = await requestUpload(eventId, { type, mimeType, size: file.size });
      if (!requested.ok) {
        setError(type, mediaErrorText(requested.error, type));
        return;
      }
      const { media, upload } = requested;
      // A new hero, logo or song replaces the unfinished ones on the server.
      setItems((current) => [
        ...current.filter(
          (item) => !(isSingleMediaType(type) && item.type === type && item.status !== 'READY'),
        ),
        media,
      ]);
      track({ mediaId: media.id });

      if (!(await putFile(upload, file, (progress) => track({ progress })))) {
        setError(type, t.errors.upload);
        setItems((current) => current.filter((item) => item.id !== media.id));
        await removeMedia(eventId, media.id).catch(() => undefined);
        return;
      }
      const confirmed = await confirmUpload(eventId, media.id);
      if (confirmed.ok) replaceItem(confirmed.media);
      else setError(type, mediaErrorText(confirmed.error, type));
    } catch {
      setError(type, t.errors.unavailable);
    } finally {
      setUploads((current) => current.filter((upload) => upload.localId !== localId));
    }
  };

  /** Uploads the files one after the other (kinder to mobile connections). */
  const upload = async (type: MediaType, files: File[]) => {
    setError(type, undefined);
    let accepted = files;
    if (!isSingleMediaType(type)) {
      const taken =
        items.filter((item) => item.type === type && item.status !== 'FAILED').length +
        uploads.filter((item) => item.type === type && item.mediaId === null).length;
      const room = Math.max(0, UPLOAD_RULES[type].maxCount - taken);
      accepted = files.slice(0, room);
      if (accepted.length < files.length) {
        setError(type, fillTemplate(t.gallery.tooMany, { count: String(room) }));
      }
    } else {
      accepted = files.slice(0, 1);
    }
    for (const file of accepted) await uploadFile(type, file);
  };

  const remove = async (item: MediaItem) => {
    if (!window.confirm(t.removeConfirm)) return;
    setError(item.type, undefined);
    try {
      const result = await removeMedia(eventId, item.id);
      if (result.ok || result.error === 'not-found') {
        setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      } else {
        setError(item.type, mediaErrorText(result.error, item.type));
      }
    } catch {
      setError(item.type, t.errors.unavailable);
    }
  };

  const move = async (item: MediaItem, direction: -1 | 1) => {
    setError(item.type, undefined);
    try {
      const result = await reorderMedia(eventId, item.id, direction);
      if (result.ok) setItems(result.items);
      else setError(item.type, mediaErrorText(result.error, item.type));
    } catch {
      setError(item.type, t.errors.unavailable);
    }
  };

  const describe = async (item: MediaItem, altText: string) => {
    setError(item.type, undefined);
    try {
      const result = await saveAltText(eventId, item.id, altText);
      if (result.ok) replaceItem({ ...item, altText });
      else setError(item.type, mediaErrorText(result.error, item.type));
    } catch {
      setError(item.type, t.errors.unavailable);
    }
  };

  const retry = async (item: MediaItem) => {
    setError(item.type, undefined);
    try {
      const result = await retryProcessing(eventId, item.id);
      if (result.ok) replaceItem(result.media);
      else setError(item.type, mediaErrorText(result.error, item.type));
    } catch {
      setError(item.type, t.errors.unavailable);
    }
  };

  return { items, uploads, errors, upload, remove, move, describe, retry };
}
