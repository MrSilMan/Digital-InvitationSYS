import 'server-only';

import { type JobsOptions, Queue } from 'bullmq';

import { getServerEnv } from '@/env';
import { logger } from '@/lib/logger';

/**
 * The producer side of a BullMQ queue, shared by the app's queues (media, guests). The web app
 * only adds jobs; the worker (worker/index.ts) runs them. Each queue has a connection of its own
 * (BullMQ owns it) that keeps retrying in the background while Redis is down; commands then fail
 * fast instead of piling up, so callers can carry on (a sweep in the worker catches up).
 */

const ERROR_LOG_INTERVAL_MS = 60_000;
const ENQUEUE_TIMEOUT_MS = 2_000;

type GlobalWithQueues = typeof globalThis & { [key: symbol]: Queue | undefined };

/** The queue named `name`, created once per process (kept on globalThis under `key`). */
export function producerQueue(name: string, key: symbol, defaultJobOptions: JobsOptions): Queue {
  const g = globalThis as GlobalWithQueues;
  const existing = g[key];
  if (existing) return existing;

  const env = getServerEnv();
  const queue = new Queue(name, {
    connection: {
      url: env.REDIS_URL,
      connectTimeout: 2_000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectionName: `convites-${env.SERVICE_NAME}-${name}-queue`,
    },
    defaultJobOptions,
  });
  // Reconnection attempts report every failure: log them once a minute at most.
  let lastErrorLogAt = 0;
  queue.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLogAt < ERROR_LOG_INTERVAL_MS) return;
    lastErrorLogAt = now;
    logger.warn('Queue connection error', { queue: name, err });
  });
  g[key] = queue;
  return queue;
}

/** Adds a job; false (logged) when Redis is unavailable or too slow to answer. */
export async function addJob(
  getQueue: () => Queue,
  name: string,
  data: unknown,
  options: JobsOptions = {},
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const queue = getQueue();
    await Promise.race([
      queue.add(name, data, options),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Queue timeout')), ENQUEUE_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch (err) {
    logger.warn('Could not queue a job', { job: name, err });
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * For the worker's sweeps: queues a job again, unless one with the same ID is still waiting or
 * running. A finished job with that ID would make the new one a no-op, so it is removed first.
 */
export async function requeueJob(
  queue: Queue,
  name: string,
  data: unknown,
  jobId: string,
): Promise<void> {
  const existing = await queue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state !== 'completed' && state !== 'failed' && state !== 'unknown') return;
    await existing.remove();
  }
  await queue.add(name, data, { jobId });
}
