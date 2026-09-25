// Must stay the first import: sets up the environment before the logger reads it.
import './setup';

import { randomUUID } from 'node:crypto';

import * as Sentry from '@sentry/node';
import { type Job, UnrecoverableError, Worker } from 'bullmq';
import sharp from 'sharp';
import { z } from 'zod';

import { assertServerEnv, getServerEnv } from '@/env';
import { setErrorReporter } from '@/lib/error-reporter';
import { logger } from '@/lib/logger';
import { runWithRequestContext } from '@/lib/request-context';
import { sentryErrorReporter, serverSentryOptions } from '@/lib/sentry/server-options';
import { getPrisma } from '@/server/db/prisma';
import { markImportFailed, runGuestImport, sweepGuestImports } from '@/server/guests/import';
import { deleteStoredFiles } from '@/server/media/files';
import { markMediaFailed, processMedia, sweepMedia } from '@/server/media/processing';
import { getGuestQueue, GUEST_QUEUE } from '@/server/queues/guest-queue';
import { getMediaQueue, MEDIA_QUEUE } from '@/server/queues/media-queue';
import { getRedis } from '@/server/redis';

/**
 * The background worker: runs the jobs of the "media" queue (src/server/queues/media-queue.ts)
 * and of the "guests" queue (CSV imports, src/server/queues/guest-queue.ts), each with its own
 * BullMQ worker so imports never wait behind image processing, and schedules both sweeps. Start
 * it with `npm run worker` (`npm run worker:dev` restarts on changes). SIGTERM/SIGINT stop it
 * gracefully: running jobs finish first.
 */

/** Jobs at once: image processing is CPU and memory heavy on small machines. */
const MEDIA_CONCURRENCY = 2;
const GUEST_CONCURRENCY = 2;
const SWEEP_EVERY_MS = 5 * 60_000;
const SHUTDOWN_TIMEOUT_MS = 30_000;

const processMediaData = z.object({ mediaId: z.uuid() });
const deleteFilesData = z.object({
  keys: z.array(z.string().min(1)).max(1_000),
  prefixes: z.array(z.string().min(1)).max(1_000),
});
const importGuestsData = z.object({ importId: z.uuid() });

function parseData<T>(schema: z.ZodType<T>, job: Job): T {
  const result = schema.safeParse(job.data);
  if (!result.success) throw new UnrecoverableError(`Invalid data for job "${job.name}"`);
  return result.data;
}

async function handle(job: Job): Promise<unknown> {
  switch (job.name) {
    case 'process-media':
      return processMedia(parseData(processMediaData, job).mediaId);
    case 'delete-files': {
      const files = parseData(deleteFilesData, job);
      await deleteStoredFiles(files);
      return { keys: files.keys.length, prefixes: files.prefixes.length };
    }
    case 'sweep-media':
      return sweepMedia();
    case 'import-guests':
      return runGuestImport(parseData(importGuestsData, job).importId);
    case 'sweep-imports':
      return sweepGuestImports();
    default:
      throw new UnrecoverableError(`Unknown job "${job.name}"`);
  }
}

/** Sweeps that found nothing are logged at debug level (they run every few minutes). */
function isQuietResult(job: Job, result: unknown): boolean {
  if (job.name === 'sweep-media') {
    const { requeued, removed } = result as Awaited<ReturnType<typeof sweepMedia>>;
    return requeued === 0 && removed === 0;
  }
  if (job.name === 'sweep-imports') {
    const { requeued, abandoned } = result as Awaited<ReturnType<typeof sweepGuestImports>>;
    return requeued === 0 && abandoned === 0;
  }
  return false;
}

/** After a job's last attempt: what it was working on is marked as failed for the couple. */
async function markFailed(job: Job, meta: Record<string, unknown>): Promise<void> {
  // Unmarked (database down), the item stays PENDING and its sweep queues it again.
  const warn = (err: unknown) => logger.warn('Could not mark the job as failed', { ...meta, err });
  if (job.name === 'process-media') {
    const data = processMediaData.safeParse(job.data);
    if (data.success) await markMediaFailed(data.data.mediaId, 'error').catch(warn);
  } else if (job.name === 'import-guests') {
    const data = importGuestsData.safeParse(job.data);
    if (data.success) await markImportFailed(data.data.importId).catch(warn);
  }
}

/** One job run, with its own log context (like a request) and a log line for its outcome. */
function runJob(job: Job): Promise<unknown> {
  return runWithRequestContext({ requestId: randomUUID() }, async () => {
    const startedAt = performance.now();
    const attempt = job.attemptsMade + 1;
    const meta = { job: job.name, jobId: job.id, attempt };
    try {
      const result = await handle(job);
      const durationMs = Math.round(performance.now() - startedAt);
      logger.log(isQuietResult(job, result) ? 'debug' : 'info', 'Job completed', {
        ...meta,
        result,
        durationMs,
      });
      return result;
    } catch (err) {
      const final = err instanceof UnrecoverableError || attempt >= (job.opts.attempts ?? 1);
      if (!final) {
        logger.warn('Job failed, will retry', { ...meta, err });
        throw err;
      }
      logger.error('Job failed', { ...meta, err });
      await markFailed(job, meta);
      throw err;
    }
  });
}

async function main(): Promise<void> {
  assertServerEnv();
  const env = getServerEnv();
  Sentry.init(serverSentryOptions(env));
  setErrorReporter(sentryErrorReporter(Sentry.captureException));

  // A long-running process: libvips' operation cache would only grow.
  sharp.cache(false);
  // Cache invalidation goes through the shared client; connect it now, not on first use.
  await getRedis()
    .connect()
    .catch((err: unknown) => logger.warn('Redis is not available yet', { err }));

  const startWorker = (queueName: string, concurrency: number) => {
    const worker = new Worker(queueName, runJob, {
      connection: {
        url: env.REDIS_URL,
        // Required by BullMQ for workers: commands wait for Redis to come back.
        maxRetriesPerRequest: null,
        connectionName: `convites-worker-${queueName}`,
      },
      concurrency,
    });
    worker.on('error', (err) => logger.warn('Worker error', { queue: queueName, err }));
    return worker;
  };
  const queues = [getMediaQueue(), getGuestQueue()];
  const workers = [
    startWorker(MEDIA_QUEUE, MEDIA_CONCURRENCY),
    startWorker(GUEST_QUEUE, GUEST_CONCURRENCY),
  ];

  await getMediaQueue().upsertJobScheduler(
    'sweep-media',
    { every: SWEEP_EVERY_MS },
    { name: 'sweep-media', data: {} },
  );
  await getGuestQueue().upsertJobScheduler(
    'sweep-imports',
    { every: SWEEP_EVERY_MS },
    { name: 'sweep-imports', data: {} },
  );
  logger.info('Worker started', {
    queues: { [MEDIA_QUEUE]: MEDIA_CONCURRENCY, [GUEST_QUEUE]: GUEST_CONCURRENCY },
  });

  let stopping = false;
  const stop = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info('Worker stopping', { signal });
    const forceExit = setTimeout(() => {
      logger.warn('Worker did not stop in time, exiting');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();
    try {
      await Promise.all(workers.map((worker) => worker.close()));
      await Promise.all(queues.map((queue) => queue.close()));
      getRedis().disconnect();
      await getPrisma().$disconnect();
      await Sentry.close(2_000);
    } finally {
      process.exit(0);
    }
  };
  process.once('SIGTERM', () => void stop('SIGTERM'));
  process.once('SIGINT', () => void stop('SIGINT'));
}

main().catch((err: unknown) => {
  logger.error('Worker failed to start', { err });
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 1_000).unref();
});
