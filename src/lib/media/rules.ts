/**
 * What couples may upload, checked in the browser (instant feedback), when the upload URL is
 * issued, and again by the worker on the file itself. Plain data: shared by all three.
 */

export const MEDIA_TYPES = ['HERO', 'LOGO', 'GALLERY', 'MUSIC'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

const MB = 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface UploadRule {
  /** Accepted MIME types (`accept` of the file input, and the signed Content-Type). */
  mimeTypes: readonly string[];
  maxBytes: number;
  /** How many the event can have (single types are replaced by the next upload). */
  maxCount: number;
}

export const UPLOAD_RULES: Record<MediaType, UploadRule> = {
  HERO: { mimeTypes: IMAGE_TYPES, maxBytes: 15 * MB, maxCount: 1 },
  LOGO: { mimeTypes: IMAGE_TYPES, maxBytes: 5 * MB, maxCount: 1 },
  GALLERY: { mimeTypes: IMAGE_TYPES, maxBytes: 15 * MB, maxCount: 12 },
  MUSIC: { mimeTypes: ['audio/mpeg'], maxBytes: 5 * MB, maxCount: 1 },
};

/** Longest photo description (read by screen readers in place of the photo). */
export const ALT_TEXT_MAX = 200;

/** Types with one file per event: a new upload replaces the old one once it is processed. */
export function isSingleMediaType(type: MediaType): boolean {
  return UPLOAD_RULES[type].maxCount === 1;
}

/** Browsers disagree on some names ("audio/mp3", "image/jpg"). */
export function normalizeMimeType(mimeType: string): string {
  const lower = mimeType.trim().toLowerCase();
  if (lower === 'audio/mp3' || lower === 'audio/mpeg3') return 'audio/mpeg';
  if (lower === 'image/jpg' || lower === 'image/pjpeg') return 'image/jpeg';
  return lower;
}

const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
};

/** A picked file's MIME type; some phones report none, then the extension decides. */
export function fileMimeType(file: { type: string; name: string }): string {
  if (file.type) return normalizeMimeType(file.type);
  const extension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
  return TYPES_BY_EXTENSION[extension] ?? '';
}

/**
 * Why the worker did not accept an upload (stored in Media.error, explained in the dashboard):
 * the file never arrived, is bigger than allowed, is not a readable JPEG/PNG/WebP, has too many
 * pixels, is not an MP3, or processing kept failing for another reason (worth another try).
 */
export const MEDIA_FAILURES = [
  'missing',
  'too-large',
  'unreadable',
  'too-many-pixels',
  'not-mp3',
  'error',
] as const;
export type MediaFailure = (typeof MEDIA_FAILURES)[number];

export function toMediaFailure(value: string | null): MediaFailure | null {
  if (value === null) return null;
  return (MEDIA_FAILURES as readonly string[]).includes(value) ? (value as MediaFailure) : 'error';
}

/** Only failures of our own can go away with a retry; the others need another file. */
export function isRetryableFailure(failure: MediaFailure): boolean {
  return failure === 'error';
}

export type UploadProblem = 'type' | 'size' | 'empty';

/** Why a file cannot be uploaded as `type`, or null when it can. */
export function uploadProblem(
  type: MediaType,
  file: { mimeType: string; size: number },
): UploadProblem | null {
  const rule = UPLOAD_RULES[type];
  if (!rule.mimeTypes.includes(normalizeMimeType(file.mimeType))) return 'type';
  if (file.size <= 0) return 'empty';
  if (file.size > rule.maxBytes) return 'size';
  return null;
}
