import 'server-only';

import { logger } from '@/lib/logger';
import { processedPrefix } from '@/lib/media/keys';
import { enqueueFileDeletion, type MediaJobData } from '@/server/queues/media-queue';
import { deleteObjects, deletePrefix } from '@/server/storage/s3';

/** What locates a media's stored files. */
export interface StoredMedia {
  id: string;
  eventId: string;
  originalKey: string;
}

export type StoredFiles = MediaJobData['delete-files'];

/** The files of media: their originals and their folders of processed files. */
export function storedFiles(media: readonly StoredMedia[]): StoredFiles {
  return {
    // Demo media point at files in /public, never at the bucket.
    keys: media.map((item) => item.originalKey).filter((key) => key.startsWith('originals/')),
    prefixes: media.map((item) => processedPrefix(item.eventId, item.id)),
  };
}

/** Deletes stored files right away (job `delete-files`). */
export async function deleteStoredFiles(files: StoredFiles): Promise<void> {
  await deleteObjects(files.keys);
  for (const prefix of files.prefixes) await deletePrefix(prefix);
}

/**
 * Removes the files of media whose rows were deleted, without failing the caller: through the
 * queue (retried by the worker), or directly when Redis is down. Files are only left behind, and
 * reported, when both fail.
 */
export async function discardStoredFiles(media: readonly StoredMedia[]): Promise<void> {
  if (media.length === 0) return;
  const files = storedFiles(media);
  if (await enqueueFileDeletion(files)) return;
  try {
    await deleteStoredFiles(files);
  } catch (err) {
    logger.error('Media files left in storage', { mediaIds: media.map((item) => item.id), err });
  }
}
