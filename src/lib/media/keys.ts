/**
 * Object-storage keys. Uploads land under `originals/` (never served: they may carry GPS data in
 * their EXIF); the worker writes what pages show under `media/`, which `/m/…` serves. Every upload
 * gets a new media ID, so a key's content never changes (cached forever).
 */

export const SERVED_PREFIX = 'media/';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
};

export function originalKey(eventId: string, mediaId: string, mimeType: string): string {
  return `originals/${eventId}/${mediaId}.${EXTENSIONS[mimeType] ?? 'bin'}`;
}

export function imageVariantKey(eventId: string, mediaId: string, width: number): string {
  return `${SERVED_PREFIX}${eventId}/${mediaId}/w${width}.webp`;
}

export function audioKey(eventId: string, mediaId: string): string {
  return `${SERVED_PREFIX}${eventId}/${mediaId}/musica.mp3`;
}

/** The folder of a media's processed files (deleted as a whole with the media). */
export function processedPrefix(eventId: string, mediaId: string): string {
  return `${SERVED_PREFIX}${eventId}/${mediaId}/`;
}

/** Folders that may be deleted by prefix: at least one ID below `media/` or `originals/`. */
export function isDeletablePrefix(prefix: string): boolean {
  return /^(?:media|originals)\/(?:[a-z0-9-]+\/)+$/.test(prefix);
}

/** The public path of a served key ("media/a/b/w960.webp" → "/m/a/b/w960.webp"), else null. */
export function servedPath(key: string): string | null {
  if (!key.startsWith(SERVED_PREFIX)) return null;
  const rest = key.slice(SERVED_PREFIX.length);
  return /^(?:[a-z0-9-]+\/)+[a-z0-9-]+\.(?:webp|mp3)$/.test(rest) ? `/m/${rest}` : null;
}
