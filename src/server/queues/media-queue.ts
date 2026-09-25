import 'server-only';

import type { JobsOptions, Queue } from 'bullmq';

import { addJob, producerQueue, requeueJob } from './producer';

/**
 * The "media" job queue (BullMQ on Redis), processed by the worker (worker/index.ts):
 * - `process-media`: turn an upload into the files pages show (WebP sizes, checked MP3);
 * - `delete-files`: remove the stored files of deleted or replaced media;
 * - `sweep-media`: scheduled by the worker, catches uploads whose job was never queued.
 * The web app only adds jobs. When Redis is down, adding fails fast (the caller carries on: the
 * media stays PENDING and the sweep queues it later).
 */

export const MEDIA_QUEUE = 'media';

export interface MediaJobData {
  'process-media': { mediaId: string };
  'delete-files': { keys: string[]; prefixes: string[] };
  'sweep-media': Record<string, never>;
}
export type MediaJobName = keyof MediaJobData;

/** Retries with exponential backoff (10 s, 20 s, 40 s…); finished jobs are kept a while for support. */
export const MEDIA_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 10_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
} as const satisfies JobsOptions;

/** One job per upload: queueing it twice (upload completed, then the sweep) is a no-op. */
export const processJobId = (mediaId: string) => `process-${mediaId}`;

const QUEUE_KEY = Symbol.for('convites.mediaQueue');

export function getMediaQueue(): Queue {
  return producerQueue(MEDIA_QUEUE, QUEUE_KEY, MEDIA_JOB_OPTIONS);
}

function enqueue<N extends MediaJobName>(
  name: N,
  data: MediaJobData[N],
  options: JobsOptions = {},
): Promise<boolean> {
  return addJob(getMediaQueue, name, data, options);
}

/**
 * Queues the processing of an upload; false when Redis is unavailable (the sweep catches it).
 * A retry of a failed media passes `retry`: the failed job keeps its ID for a week.
 */
export function enqueueMediaProcessing(mediaId: string, options: { retry?: boolean } = {}) {
  const jobId = options.retry
    ? `${processJobId(mediaId)}-retry-${Date.now().toString(36)}`
    : processJobId(mediaId);
  return enqueue('process-media', { mediaId }, { jobId });
}

/** Queues the removal of stored files; false when Redis is unavailable. */
export function enqueueFileDeletion(files: MediaJobData['delete-files']) {
  if (files.keys.length === 0 && files.prefixes.length === 0) return Promise.resolve(true);
  return enqueue('delete-files', files);
}

/** For the sweep (worker): queues the processing again, unless its job is still waiting or running. */
export function requeueMediaProcessing(mediaId: string): Promise<void> {
  return requeueJob(getMediaQueue(), 'process-media', { mediaId }, processJobId(mediaId));
}
