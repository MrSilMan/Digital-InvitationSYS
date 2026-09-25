'use client';

import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconLoader2,
  IconPhotoX,
  IconRefresh,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { type ReactNode, useId, useRef, useState } from 'react';

import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { MediaImage } from '@/features/invitation/media-image';
import { editor } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { ALT_TEXT_MAX, isRetryableFailure, type MediaType, UPLOAD_RULES } from '@/lib/media/rules';
import { fillTemplate } from '@/lib/template';

import { FieldGroup, SectionVisibility } from '../editor/fields';

import type { MediaItem } from './types';
import { type UploadInProgress, useMedia } from './use-media';

const t = editor.media;

const ACCEPT: Record<MediaType, string> = {
  HERO: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  LOGO: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  GALLERY: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  MUSIC: 'audio/mpeg,.mp3',
};

const SINGLE_TEXTS = { HERO: t.hero, LOGO: t.logo, MUSIC: t.music } as const;

function last<T>(list: T[]): T | undefined {
  return list[list.length - 1];
}

/** A button that opens the file picker (the input itself stays hidden). */
function FilePicker({
  type,
  label,
  multiple = false,
  disabled = false,
  onFiles,
}: {
  type: MediaType;
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPT[type]}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-media-input={type}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) onFiles(files);
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className={buttonClasses('secondary')}
      >
        <IconUpload size={18} stroke={1.75} aria-hidden="true" />
        {label}
      </button>
    </>
  );
}

function ErrorMessage({ message }: { message: string | undefined }) {
  return message ? (
    <p role="alert" className="font-sans text-sm text-red-700">
      {message}
    </p>
  ) : null;
}

/** Upload progress, processing or failure of one media. */
function MediaStatus({
  item,
  upload,
  onRetry,
  className,
}: {
  item: MediaItem | null;
  upload: UploadInProgress | undefined;
  onRetry: (item: MediaItem) => void;
  className?: string;
}) {
  if (upload || item?.status === 'PENDING') {
    const text = upload
      ? fillTemplate(t.uploading, { percent: String(Math.round(upload.progress * 100)) })
      : t.processing;
    return (
      <div className={cn('flex items-center gap-2 font-sans text-sm text-stone-600', className)}>
        <IconLoader2 size={18} stroke={1.75} className="animate-spin" aria-hidden="true" />
        <span>{text}</span>
      </div>
    );
  }
  if (item?.status === 'FAILED' && item.failure) {
    return (
      <div className={cn('flex flex-col items-start gap-2 font-sans text-sm', className)}>
        <p className="flex items-start gap-2 text-red-700">
          <IconAlertTriangle size={18} stroke={1.75} className="shrink-0" aria-hidden="true" />
          <span>{t.failures[item.failure]}</span>
        </p>
        {isRetryableFailure(item.failure) ? (
          <button
            type="button"
            onClick={() => onRetry(item)}
            className={buttonClasses('secondary', 'sm')}
          >
            <IconRefresh size={16} stroke={1.75} aria-hidden="true" />
            {t.retry}
          </button>
        ) : null}
      </div>
    );
  }
  return null;
}

type MediaState = ReturnType<typeof useMedia>;

/** Hero, logo or music: one file, replaced by the next upload once that one is ready. */
function SingleMediaGroup({
  type,
  media,
  children,
}: {
  type: Exclude<MediaType, 'GALLERY'>;
  media: MediaState;
  /** How the current file is shown. */
  children: (current: MediaItem) => ReactNode;
}) {
  const texts = SINGLE_TEXTS[type];
  const ofType = media.items.filter((item) => item.type === type);
  const current = last(ofType.filter((item) => item.status === 'READY'));
  const next = last(ofType.filter((item) => item.status !== 'READY'));
  const upload = media.uploads.find((candidate) => candidate.type === type);
  const busy = Boolean(upload) || next?.status === 'PENDING';

  return (
    <FieldGroup legend={texts.legend} hint={texts.hint}>
      <div className="flex flex-wrap items-center gap-4">
        {current ? (
          children(current)
        ) : (
          <p className="font-sans text-sm text-stone-600">{texts.empty}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <FilePicker
            type={type}
            label={current ? t.replace : texts.upload}
            disabled={busy}
            onFiles={(files) => void media.upload(type, files)}
          />
          {current ? (
            <button
              type="button"
              onClick={() => void media.remove(current)}
              className={buttonClasses('danger')}
            >
              <IconTrash size={18} stroke={1.75} aria-hidden="true" />
              {t.remove}
            </button>
          ) : null}
        </div>
      </div>
      <div aria-live="polite" className="flex flex-col gap-2">
        {current && (upload || next?.status === 'PENDING') ? (
          <p className="font-sans text-sm text-stone-600">{t.replacing}</p>
        ) : null}
        <MediaStatus
          item={next ?? null}
          upload={upload}
          onRetry={(item) => void media.retry(item)}
        />
        {next?.status === 'FAILED' ? (
          <button
            type="button"
            onClick={() => void media.remove(next)}
            className={buttonClasses('ghost', 'sm', 'self-start')}
          >
            {t.remove}
          </button>
        ) : null}
      </div>
      <ErrorMessage message={media.errors[type]} />
    </FieldGroup>
  );
}

function AltTextInput({
  item,
  onSave,
}: {
  item: MediaItem;
  onSave: (item: MediaItem, altText: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(item.altText);
  const save = () => {
    const altText = value.trim();
    if (altText !== item.altText) onSave(item, altText);
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-sans text-xs font-medium text-stone-700">
        {t.gallery.altLabel}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={ALT_TEXT_MAX}
        placeholder={t.gallery.altPlaceholder}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          // Enter would submit the editor's form.
          if (event.key !== 'Enter') return;
          event.preventDefault();
          event.currentTarget.blur();
        }}
        className={inputClasses}
      />
    </div>
  );
}

function GalleryGroup({ media }: { media: MediaState }) {
  const max = UPLOAD_RULES.GALLERY.maxCount;
  const photos = media.items.filter((item) => item.type === 'GALLERY');
  const waiting = media.uploads.filter(
    (upload) => upload.type === 'GALLERY' && upload.mediaId === null,
  );
  const counted = photos.filter((photo) => photo.status !== 'FAILED').length + waiting.length;

  return (
    <FieldGroup legend={t.gallery.legend} hint={fillTemplate(t.gallery.hint, { max: String(max) })}>
      <SectionVisibility id="gallery" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm text-stone-600">
          {fillTemplate(t.gallery.count, { count: String(counted), max: String(max) })}
        </p>
        <FilePicker
          type="GALLERY"
          label={t.gallery.add}
          multiple
          disabled={counted >= max}
          onFiles={(files) => void media.upload('GALLERY', files)}
        />
      </div>
      <ErrorMessage message={media.errors.GALLERY} />
      {photos.length === 0 && waiting.length === 0 ? (
        <p className="font-sans text-sm text-stone-600">{t.gallery.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-live="polite">
          {photos.map((photo, index) => {
            const label = fillTemplate(t.gallery.photo, { n: String(index + 1) });
            const upload = media.uploads.find((candidate) => candidate.mediaId === photo.id);
            return (
              <li
                key={photo.id}
                className="flex flex-col gap-3 rounded-xl border border-stone-200 p-2"
                aria-label={label}
              >
                <div
                  className={cn(
                    'relative flex aspect-square items-center justify-center overflow-hidden rounded-lg',
                    photo.status === 'FAILED' ? 'bg-red-50' : 'bg-stone-100',
                  )}
                >
                  {photo.status === 'READY' && photo.thumbnailSrc ? (
                    <MediaImage
                      src={photo.thumbnailSrc}
                      alt={photo.altText || label}
                      fill
                      sizes="(max-width: 640px) 45vw, 220px"
                      className="object-cover"
                    />
                  ) : photo.status === 'FAILED' ? (
                    <IconPhotoX
                      size={32}
                      stroke={1.5}
                      className="text-red-700"
                      aria-hidden="true"
                    />
                  ) : (
                    <MediaStatus
                      item={photo}
                      upload={upload}
                      onRetry={(item) => void media.retry(item)}
                      className="p-3"
                    />
                  )}
                </div>
                {photo.status === 'FAILED' ? (
                  <MediaStatus
                    item={photo}
                    upload={undefined}
                    onRetry={(item) => void media.retry(item)}
                  />
                ) : (
                  <AltTextInput
                    item={photo}
                    onSave={(item, text) => void media.describe(item, text)}
                  />
                )}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => void media.move(photo, -1)}
                      className={buttonClasses('ghost', 'icon')}
                      aria-label={`${t.gallery.moveEarlier}: ${label}`}
                    >
                      <IconArrowLeft size={18} stroke={1.75} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1}
                      onClick={() => void media.move(photo, 1)}
                      className={buttonClasses('ghost', 'icon')}
                      aria-label={`${t.gallery.moveLater}: ${label}`}
                    >
                      <IconArrowRight size={18} stroke={1.75} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void media.remove(photo)}
                    className={buttonClasses('danger', 'icon')}
                    aria-label={`${t.remove}: ${label}`}
                  >
                    <IconTrash size={18} stroke={1.75} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
          {waiting.map((upload) => (
            <li
              key={upload.localId}
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-stone-300 p-3"
            >
              <MediaStatus item={null} upload={upload} onRetry={() => undefined} />
            </li>
          ))}
        </ul>
      )}
    </FieldGroup>
  );
}

/**
 * "Multimédia": hero illustration, logo, gallery and music. Unlike the other tabs, files are
 * saved as soon as they are uploaded and reach guests once processed (`onPublished` then
 * refreshes the preview).
 */
export function MediaTab({
  eventId,
  initialItems,
  onPublished,
}: {
  eventId: string;
  initialItems: MediaItem[];
  onPublished: () => void;
}) {
  const media = useMedia(eventId, initialItems, onPublished);
  return (
    <div className="flex flex-col gap-10">
      <p className="rounded-xl bg-stone-100 px-4 py-3 font-sans text-sm text-stone-700">
        {t.intro}
      </p>
      <SingleMediaGroup type="HERO" media={media}>
        {(current) => (
          <div className="relative h-32 w-48 overflow-hidden rounded-lg bg-stone-100">
            {current.thumbnailSrc ? (
              <MediaImage
                src={current.thumbnailSrc}
                alt={t.hero.current}
                fill
                sizes="192px"
                className="object-contain"
              />
            ) : null}
          </div>
        )}
      </SingleMediaGroup>
      <SingleMediaGroup type="LOGO" media={media}>
        {(current) => (
          <div className="relative size-28 overflow-hidden rounded-lg bg-stone-100">
            {current.thumbnailSrc ? (
              <MediaImage
                src={current.thumbnailSrc}
                alt={t.logo.current}
                fill
                sizes="112px"
                className="object-contain p-2"
              />
            ) : null}
          </div>
        )}
      </SingleMediaGroup>
      <GalleryGroup media={media} />
      <SingleMediaGroup type="MUSIC" media={media}>
        {(current) =>
          current.audioSrc ? (
            <audio
              controls
              preload="none"
              src={current.audioSrc}
              aria-label={t.music.current}
              className="w-full max-w-sm"
            />
          ) : null
        }
      </SingleMediaGroup>
    </div>
  );
}
