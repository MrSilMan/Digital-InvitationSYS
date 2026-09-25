import 'server-only';

import type { MediaItem } from '@/features/dashboard/media/types';
import type { Prisma } from '@/generated/prisma/client';
import { originalKey } from '@/lib/media/keys';
import {
  isRetryableFailure,
  isSingleMediaType,
  type MediaType,
  normalizeMimeType,
  toMediaFailure,
  UPLOAD_RULES,
} from '@/lib/media/rules';
import { getPrisma } from '@/server/db/prisma';
import { invalidateInvitationEvent } from '@/server/invitations/queries';
import { enqueueMediaProcessing } from '@/server/queues/media-queue';
import { headObject, type PresignedUpload, presignUpload } from '@/server/storage/s3';

import { discardStoredFiles } from './files';
import { uuidv7 } from './ids';
import { mediaUrl } from './urls';
import { audioFileKey, imageFiles } from './variants';

/**
 * The couple's media for the dashboard's "Multimédia" tab. The Server Actions have checked the
 * session, the event's owner and the input; `event` comes from that check. Media reach guests
 * once processed, so every change that can touch a READY media clears the event's cached page.
 */

interface EventRef {
  id: string;
  slug: string;
}

const mediaItemSelect = {
  id: true,
  eventId: true,
  type: true,
  status: true,
  error: true,
  originalKey: true,
  variants: true,
  width: true,
  height: true,
  sizeBytes: true,
  altText: true,
  createdAt: true,
} satisfies Prisma.MediaSelect;

type MediaItemRow = Prisma.MediaGetPayload<{ select: typeof mediaItemSelect }>;

export function toMediaItem(row: MediaItemRow): MediaItem {
  const ready = row.status === 'READY';
  const smallest = imageFiles(row.variants)[0];
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    failure: row.status === 'FAILED' ? (toMediaFailure(row.error) ?? 'error') : null,
    thumbnailSrc: ready && row.type !== 'MUSIC' ? mediaUrl(smallest?.key ?? row.originalKey) : null,
    audioSrc:
      ready && row.type === 'MUSIC'
        ? mediaUrl(audioFileKey(row.variants) ?? row.originalKey)
        : null,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    altText: row.altText ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listEventMedia(eventId: string): Promise<MediaItem[]> {
  const rows = await getPrisma().media.findMany({
    where: { eventId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: mediaItemSelect,
  });
  return rows.map(toMediaItem);
}

/** Serializes the media changes of one event (limits and positions cannot be raced). */
async function lockEvent(tx: Prisma.TransactionClient, eventId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "event" WHERE id = ${eventId}::uuid FOR UPDATE`;
}

export type CreateUploadResult =
  { ok: true; media: MediaItem; upload: PresignedUpload } | { ok: false; error: 'limit' };

/**
 * Creates a PENDING media and the URL the browser uploads its file to. A hero, logo or song
 * replaces unfinished or failed uploads of its type right away; the one in use stays until the
 * new one is processed (processMedia replaces it then).
 */
export async function createUpload(
  event: EventRef,
  input: { type: MediaType; mimeType: string; size: number },
): Promise<CreateUploadResult> {
  const mimeType = normalizeMimeType(input.mimeType);
  const id = uuidv7();
  const key = originalKey(event.id, id, mimeType);

  const created = await getPrisma().$transaction(async (tx) => {
    await lockEvent(tx, event.id);
    const sameType = await tx.media.findMany({
      where: { eventId: event.id, type: input.type },
      select: { id: true, eventId: true, originalKey: true, status: true, position: true },
    });
    let superseded: typeof sameType = [];
    if (isSingleMediaType(input.type)) {
      superseded = sameType.filter((row) => row.status !== 'READY');
      if (superseded.length > 0) {
        await tx.media.deleteMany({ where: { id: { in: superseded.map((row) => row.id) } } });
      }
    } else {
      const counted = sameType.filter((row) => row.status !== 'FAILED').length;
      if (counted >= UPLOAD_RULES[input.type].maxCount) return null;
    }
    const position = sameType.reduce((next, row) => Math.max(next, row.position + 1), 0);
    const row = await tx.media.create({
      data: {
        id,
        eventId: event.id,
        type: input.type,
        status: 'PENDING',
        originalKey: key,
        mimeType,
        sizeBytes: input.size,
        position,
      },
      select: mediaItemSelect,
    });
    return { row, superseded };
  });
  if (!created) return { ok: false, error: 'limit' };

  await discardStoredFiles(created.superseded);
  const upload = await presignUpload({ key, contentType: mimeType, contentLength: input.size });
  return { ok: true, media: toMediaItem(created.row), upload };
}

/**
 * The browser finished uploading: check the file is really there and queue its processing.
 * Without Redis the media stays PENDING and the worker's sweep queues it within minutes.
 */
export async function completeUpload(event: EventRef, mediaId: string): Promise<MediaItem | null> {
  const prisma = getPrisma();
  const row = await prisma.media.findFirst({
    where: { id: mediaId, eventId: event.id },
    select: mediaItemSelect,
  });
  if (!row) return null;
  if (row.status !== 'PENDING') return toMediaItem(row);
  if (!(await headObject(row.originalKey))) {
    await prisma.media.updateMany({
      where: { id: row.id, status: 'PENDING' },
      data: { status: 'FAILED', error: 'missing' },
    });
    return toMediaItem({ ...row, status: 'FAILED', error: 'missing' });
  }
  await enqueueMediaProcessing(row.id);
  return toMediaItem(row);
}

/** Deletes a media and, through the queue, its files. False when there is none. */
export async function deleteMedia(event: EventRef, mediaId: string): Promise<boolean> {
  const prisma = getPrisma();
  const row = await prisma.media.findFirst({
    where: { id: mediaId, eventId: event.id },
    select: { id: true, eventId: true, originalKey: true },
  });
  if (!row) return false;
  await prisma.media.deleteMany({ where: { id: row.id } });
  await discardStoredFiles([row]);
  // Cleared even for a pending media: the worker may have published it a moment ago.
  await invalidateInvitationEvent(event.slug);
  return true;
}

/** Moves a media one place earlier (-1) or later (1) among those of its type. */
export async function moveMedia(
  event: EventRef,
  mediaId: string,
  direction: -1 | 1,
): Promise<boolean> {
  const moved = await getPrisma().$transaction(async (tx) => {
    await lockEvent(tx, event.id);
    const target = await tx.media.findFirst({
      where: { id: mediaId, eventId: event.id },
      select: { type: true },
    });
    if (!target) return false;
    const rows = await tx.media.findMany({
      where: { eventId: event.id, type: target.type },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, position: true },
    });
    const from = rows.findIndex((row) => row.id === mediaId);
    const to = from + direction;
    // Already first or last: nothing to do.
    if (from < 0 || to < 0 || to >= rows.length) return true;
    const [moving] = rows.splice(from, 1);
    if (!moving) return true;
    rows.splice(to, 0, moving);
    for (const [position, row] of rows.entries()) {
      if (row.position !== position) {
        await tx.media.update({ where: { id: row.id }, data: { position } });
      }
    }
    return true;
  });
  if (moved) await invalidateInvitationEvent(event.slug);
  return moved;
}

/** Sets a photo's description (empty: the page's generic "Foto 1 de 6"). */
export async function updateAltText(
  event: EventRef,
  mediaId: string,
  altText: string,
): Promise<boolean> {
  const { count } = await getPrisma().media.updateMany({
    where: { id: mediaId, eventId: event.id },
    data: { altText: altText || null },
  });
  if (count > 0) await invalidateInvitationEvent(event.slug);
  return count > 0;
}

/** Tries a failed processing again (only failures of our own: a bad file stays bad). */
export async function retryMedia(event: EventRef, mediaId: string): Promise<MediaItem | null> {
  const prisma = getPrisma();
  const row = await prisma.media.findFirst({
    where: { id: mediaId, eventId: event.id },
    select: mediaItemSelect,
  });
  if (!row) return null;
  const failure = row.status === 'FAILED' ? (toMediaFailure(row.error) ?? 'error') : null;
  if (!failure || !isRetryableFailure(failure)) return toMediaItem(row);
  const { count } = await prisma.media.updateMany({
    where: { id: row.id, status: 'FAILED' },
    data: { status: 'PENDING', error: null },
  });
  if (count > 0) await enqueueMediaProcessing(row.id, { retry: true });
  return toMediaItem({ ...row, status: 'PENDING', error: null });
}
