import type { MediaFailure, MediaType } from '@/lib/media/rules';

/** One upload as the "Multimédia" tab shows it. */
export interface MediaItem {
  id: string;
  type: MediaType;
  status: 'PENDING' | 'READY' | 'FAILED';
  failure: MediaFailure | null;
  /** Ready images: a small processed file for the thumbnail. */
  thumbnailSrc: string | null;
  /** Ready music: the file to listen to. */
  audioSrc: string | null;
  /** Upright size of the original (images). */
  width: number | null;
  height: number | null;
  sizeBytes: number;
  altText: string;
  createdAt: string;
}

export type MediaErrorCode =
  | 'invalid'
  | 'unauthenticated'
  | 'not-found'
  | 'rate-limited'
  | 'unavailable'
  /** The file's type, size or emptiness (checked again on the server). */
  | 'type'
  | 'size'
  | 'empty'
  /** The gallery is full. */
  | 'limit'
  /** The upload never reached the storage. */
  | 'missing';

export type MediaActionResult<T = object> =
  ({ ok: true } & T) | { ok: false; error: MediaErrorCode };
