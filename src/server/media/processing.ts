import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { logger } from '@/lib/logger';
import { audioKey, imageVariantKey, processedPrefix } from '@/lib/media/keys';
import { isSingleMediaType, type MediaFailure, UPLOAD_RULES } from '@/lib/media/rules';
import { getPrisma } from '@/server/db/prisma';
import { invalidateInvitationEvent } from '@/server/invitations/queries';
import { requeueMediaProcessing } from '@/server/queues/media-queue';
import { deletePrefix, getObjectBuffer, headObject, putObject } from '@/server/storage/s3';

import { discardStoredFiles } from './files';
import { ImageRejectedError, processImage } from './image';
import { findMp3Audio } from './mp3';
import type { AudioVariants, ImageVariants } from './variants';

/**
 * The worker's jobs on uploads (worker/index.ts). The web app creates a PENDING media when it
 * issues an upload URL and queues `process-media` once the browser has uploaded the file.
 */

const mediaToProcessSelect = {
  id: true,
  eventId: true,
  type: true,
  status: true,
  originalKey: true,
  createdAt: true,
  event: { select: { slug: true } },
} satisfies Prisma.MediaSelect;

type MediaToProcess = Prisma.MediaGetPayload<{ select: typeof mediaToProcessSelect }>;

interface ProcessedFiles {
  variants: ImageVariants | AudioVariants;
  width: number | null;
  height: number | null;
}

export type ProcessOutcome = 'ready' | 'rejected' | 'skipped' | 'gone';

/** Marks a pending media as failed, with the reason the dashboard explains. */
export async function markMediaFailed(mediaId: string, failure: MediaFailure): Promise<void> {
  await getPrisma().media.updateMany({
    where: { id: mediaId, status: 'PENDING' },
    data: { status: 'FAILED', error: failure },
  });
}

/** Writes what pages show; returns why the file cannot be used instead, if so. */
async function writeFiles(media: MediaToProcess): Promise<ProcessedFiles | MediaFailure> {
  const rule = UPLOAD_RULES[media.type];
  const head = await headObject(media.originalKey);
  if (!head) return 'missing';
  if (head.size > rule.maxBytes) return 'too-large';
  const original = await getObjectBuffer(media.originalKey, rule.maxBytes);
  if (!original) return 'missing';

  if (media.type === 'MUSIC') {
    const audio = findMp3Audio(original);
    if (!audio) return 'not-mp3';
    const key = audioKey(media.eventId, media.id);
    const body = original.subarray(audio.start, audio.end);
    await putObject(key, body, 'audio/mpeg');
    return { variants: { audio: { key, bytes: body.length } }, width: null, height: null };
  }

  let image;
  try {
    image = await processImage(original, media.type);
  } catch (err) {
    if (!(err instanceof ImageRejectedError)) throw err;
    logger.info('Image rejected', { mediaId: media.id, reason: err.reason, err: err.cause });
    return err.reason;
  }
  const variants: ImageVariants = {};
  for (const file of image.files) {
    const key = imageVariantKey(media.eventId, media.id, file.width);
    await putObject(key, file.body, 'image/webp');
    variants[`w${file.width}`] = { key, width: file.width, height: file.height };
  }
  return { variants, width: image.width, height: image.height };
}

/**
 * Job `process-media`: turns an upload into what guest pages show, then publishes it. Safe to run
 * more than once, even concurrently: only PENDING media are processed, file keys depend only on
 * the media, and a single run can mark it READY. Storage and database errors are thrown (BullMQ
 * retries); a file we cannot use marks the media FAILED with the reason.
 */
export async function processMedia(mediaId: string): Promise<ProcessOutcome> {
  const prisma = getPrisma();
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: mediaToProcessSelect,
  });
  if (!media) return 'gone';
  if (media.status !== 'PENDING') return 'skipped';

  const processed = await writeFiles(media);
  if (typeof processed === 'string') {
    await markMediaFailed(media.id, processed);
    return 'rejected';
  }

  const replaced = await prisma.$transaction(async (tx) => {
    const updated = await tx.media.updateMany({
      where: { id: media.id, status: 'PENDING' },
      data: {
        status: 'READY',
        error: null,
        variants: processed.variants,
        width: processed.width,
        height: processed.height,
      },
    });
    if (updated.count === 0) return null;
    if (!isSingleMediaType(media.type)) return [];
    // One hero, logo and song per event: this one replaces those uploaded before it.
    const older = await tx.media.findMany({
      where: {
        eventId: media.eventId,
        type: media.type,
        id: { not: media.id },
        createdAt: { lt: media.createdAt },
      },
      select: { id: true, eventId: true, originalKey: true },
    });
    if (older.length > 0) {
      await tx.media.deleteMany({ where: { id: { in: older.map((item) => item.id) } } });
    }
    return older;
  });

  if (replaced === null) {
    // Finished by another run meanwhile, or deleted by the couple: then remove what we wrote.
    if (await prisma.media.count({ where: { id: media.id } })) return 'skipped';
    await deletePrefix(processedPrefix(media.eventId, media.id));
    return 'gone';
  }
  await discardStoredFiles(replaced);
  await invalidateInvitationEvent(media.event.slug);
  logger.info('Media ready', { mediaId, type: media.type, replaced: replaced.length });
  return 'ready';
}

/** Pending for this long without being processed: the sweep takes a look. */
export const STALE_PENDING_MS = 15 * 60_000;
/** Upload URLs expire after 5 minutes: a file still missing after an hour is never coming. */
export const ABANDONED_UPLOAD_MS = 60 * 60_000;
const SWEEP_BATCH = 100;

/**
 * Job `sweep-media` (every few minutes): uploads left PENDING. Those whose file arrived are
 * queued again (Redis was down when the upload completed, or the job got lost); those whose file
 * never arrived are removed after an hour.
 */
export async function sweepMedia(
  options: { now?: Date; requeue?: (mediaId: string) => Promise<void> } = {},
): Promise<{ requeued: number; removed: number }> {
  const now = (options.now ?? new Date()).getTime();
  const requeue = options.requeue ?? requeueMediaProcessing;
  const prisma = getPrisma();
  const stale = await prisma.media.findMany({
    where: { status: 'PENDING', updatedAt: { lt: new Date(now - STALE_PENDING_MS) } },
    select: { id: true, originalKey: true, createdAt: true },
    orderBy: { updatedAt: 'asc' },
    take: SWEEP_BATCH,
  });

  let requeued = 0;
  let removed = 0;
  for (const media of stale) {
    if (await headObject(media.originalKey)) {
      await requeue(media.id);
      requeued += 1;
    } else if (media.createdAt.getTime() < now - ABANDONED_UPLOAD_MS) {
      const { count } = await prisma.media.deleteMany({
        where: { id: media.id, status: 'PENDING' },
      });
      removed += count;
    }
  }
  return { requeued, removed };
}
