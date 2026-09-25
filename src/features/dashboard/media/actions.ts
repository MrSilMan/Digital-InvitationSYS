'use server';

import { z } from 'zod';

import { logger } from '@/lib/logger';
import { ALT_TEXT_MAX, MEDIA_TYPES, uploadProblem } from '@/lib/media/rules';
import { type EditableEvent, authorizeEventAction } from '@/server/events/access';
import {
  completeUpload,
  createUpload,
  deleteMedia,
  listEventMedia,
  moveMedia,
  retryMedia,
  updateAltText,
} from '@/server/media/dashboard';
import type { PresignedUpload } from '@/server/storage/s3';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { type RateLimitPolicy, rateLimit } from '@/server/rate-limit/sliding-window';

import type { MediaActionResult, MediaErrorCode, MediaItem } from './types';

/**
 * The "Multimédia" tab. Nothing from the browser is trusted: every action checks the session, the
 * event's owner, a rate limit and its input. Uploads go straight from the browser to storage with
 * a presigned URL; the worker then processes them (src/server/media/processing.ts).
 */

const mediaIdSchema = z.uuid();
const uploadRequestSchema = z.object({
  type: z.enum(MEDIA_TYPES),
  mimeType: z.string().trim().min(1).max(100),
  size: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
const directionSchema = z.union([z.literal(-1), z.literal(1)]);
const altTextSchema = z.string().trim().max(ALT_TEXT_MAX);

type Authorized = { ok: true; event: EditableEvent } | { ok: false; error: MediaErrorCode };

async function authorize(eventId: unknown, policy?: RateLimitPolicy): Promise<Authorized> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return auth;
  if (policy) {
    const limit = await rateLimit(policy, auth.user.id);
    if (!limit.allowed) return { ok: false, error: 'rate-limited' };
  }
  return { ok: true, event: auth.event };
}

/** Runs a storage or database step; failures are logged and answered with "unavailable". */
async function attempt<R extends { ok: boolean }>(
  what: string,
  eventId: string,
  step: () => Promise<R>,
): Promise<R | { ok: false; error: 'unavailable' }> {
  try {
    return await step();
  } catch (err) {
    logger.error(`Media ${what} failed`, { err, eventId });
    return { ok: false, error: 'unavailable' };
  }
}

/** The event's media (the tab polls it while files are being processed). */
export async function listMedia(
  eventId: unknown,
): Promise<MediaActionResult<{ items: MediaItem[] }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  return attempt('listing', auth.event.id, async () => ({
    ok: true,
    items: await listEventMedia(auth.event.id),
  }));
}

/** Step 1 of an upload: a PENDING media and the URL to PUT the file to (5 minutes). */
export async function requestUpload(
  eventId: unknown,
  input: unknown,
): Promise<MediaActionResult<{ media: MediaItem; upload: PresignedUpload }>> {
  const auth = await authorize(eventId, RATE_LIMITS.mediaUploadsPerUser);
  if (!auth.ok) return auth;
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const problem = uploadProblem(parsed.data.type, {
    mimeType: parsed.data.mimeType,
    size: parsed.data.size,
  });
  if (problem) return { ok: false, error: problem };

  return attempt('upload request', auth.event.id, async () => {
    const result = await createUpload(auth.event, parsed.data);
    if (!result.ok) return result;
    logger.info('Media upload started', {
      eventId: auth.event.id,
      mediaId: result.media.id,
      type: parsed.data.type,
      sizeBytes: parsed.data.size,
    });
    return { ok: true, media: result.media, upload: result.upload };
  });
}

/** Step 2: the browser uploaded the file; it is checked and queued for processing. */
export async function confirmUpload(
  eventId: unknown,
  mediaId: unknown,
): Promise<MediaActionResult<{ media: MediaItem }>> {
  const auth = await authorize(eventId, RATE_LIMITS.mediaChangesPerUser);
  if (!auth.ok) return auth;
  const id = mediaIdSchema.safeParse(mediaId);
  if (!id.success) return { ok: false, error: 'invalid' };
  return attempt('upload confirmation', auth.event.id, async () => {
    const media = await completeUpload(auth.event, id.data);
    return media ? { ok: true, media } : { ok: false, error: 'not-found' };
  });
}

export async function removeMedia(eventId: unknown, mediaId: unknown): Promise<MediaActionResult> {
  const auth = await authorize(eventId, RATE_LIMITS.mediaChangesPerUser);
  if (!auth.ok) return auth;
  const id = mediaIdSchema.safeParse(mediaId);
  if (!id.success) return { ok: false, error: 'invalid' };
  return attempt('deletion', auth.event.id, async () => {
    const deleted = await deleteMedia(auth.event, id.data);
    if (deleted) logger.info('Media deleted', { eventId: auth.event.id, mediaId: id.data });
    return deleted ? { ok: true } : { ok: false, error: 'not-found' };
  });
}

/** Moves a gallery photo one place earlier (-1) or later (1). */
export async function reorderMedia(
  eventId: unknown,
  mediaId: unknown,
  direction: unknown,
): Promise<MediaActionResult<{ items: MediaItem[] }>> {
  const auth = await authorize(eventId, RATE_LIMITS.mediaChangesPerUser);
  if (!auth.ok) return auth;
  const id = mediaIdSchema.safeParse(mediaId);
  const step = directionSchema.safeParse(direction);
  if (!id.success || !step.success) return { ok: false, error: 'invalid' };
  return attempt('reordering', auth.event.id, async () => {
    if (!(await moveMedia(auth.event, id.data, step.data))) {
      return { ok: false, error: 'not-found' };
    }
    return { ok: true, items: await listEventMedia(auth.event.id) };
  });
}

export async function saveAltText(
  eventId: unknown,
  mediaId: unknown,
  altText: unknown,
): Promise<MediaActionResult> {
  const auth = await authorize(eventId, RATE_LIMITS.mediaChangesPerUser);
  if (!auth.ok) return auth;
  const id = mediaIdSchema.safeParse(mediaId);
  const text = altTextSchema.safeParse(altText);
  if (!id.success || !text.success) return { ok: false, error: 'invalid' };
  return attempt('description update', auth.event.id, async () =>
    (await updateAltText(auth.event, id.data, text.data))
      ? { ok: true }
      : { ok: false, error: 'not-found' },
  );
}

/** Processes a media again after a failure of ours (never after a bad file). */
export async function retryProcessing(
  eventId: unknown,
  mediaId: unknown,
): Promise<MediaActionResult<{ media: MediaItem }>> {
  const auth = await authorize(eventId, RATE_LIMITS.mediaChangesPerUser);
  if (!auth.ok) return auth;
  const id = mediaIdSchema.safeParse(mediaId);
  if (!id.success) return { ok: false, error: 'invalid' };
  return attempt('retry', auth.event.id, async () => {
    const media = await retryMedia(auth.event, id.data);
    return media ? { ok: true, media } : { ok: false, error: 'not-found' };
  });
}
