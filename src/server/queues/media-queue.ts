import 'server-only';

import { type JobsOptions, Queue } from 'bullmq';

import { getServerEnv } from '@/env';
import { logger } from '@/lib/logger';

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
type GlobalWithQueue = typeof globalThis & { [QUEUE_KEY]?: Queue };

const ERROR_LOG_INTERVAL_MS = 60_000;
let lastErrorLogAt = 0;

/**
 * The producer side of the queue, on a connection of its own (BullMQ owns it). The connection
 * keeps retrying in the background while Redis is down; commands then fail fast instead of
 * piling up.
 */
export function getMediaQueue(): Queue {
  const g = globalThis as GlobalWithQueue;
  if (!g[QUEUE_KEY]) {
    const env = getServerEnv();
    const queue = new Queue(MEDIA_QUEUE, {
      connection: {
        url: env.REDIS_URL,
        connectTimeout: 2_000,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectionName: `convites-${env.SERVICE_NAME}-queue`,
      },
      defaultJobOptions: MEDIA_JOB_OPTIONS,
    });
    // Reconnection attempts report every failure: log them once a minute at most.
    queue.on('error', (err) => {
      const now = Date.now();
      if (now - lastErrorLogAt < ERROR_LOG_INTERVAL_MS) return;
      lastErrorLogAt = now;
      logger.warn('Media queue connection error', { err });
    });
    g[QUEUE_KEY] = queue;
  }
  return g[QUEUE_KEY];
}

const ENQUEUE_TIMEOUT_MS = 2_000;

async function enqueue<N extends MediaJobName>(
  name: N,
  data: MediaJobData[N],
  options: JobsOptions = {},
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const queue = getMediaQueue();
    await Promise.race([
      queue.add(name, data, options),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Queue timeout')), ENQUEUE_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch (err) {
    logger.warn('Could not queue a media job', { job: name, err });
    return false;
  } finally {
    clearTimeout(timer);
  }
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

/**
 * For the sweep (worker): queues the processing again, unless its job is still waiting or
 * running. A finished job with the same ID would make the new one a no-op, so it is removed.
 */
export async function requeueMediaProcessing(mediaId: string): Promise<void> {
  const queue = getMediaQueue();
  const jobId = processJobId(mediaId);
  const existing = await queue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state !== 'completed' && state !== 'failed' && state !== 'unknown') return;
    await existing.remove();
  }
  await queue.add('process-media', { mediaId }, { jobId });
}
