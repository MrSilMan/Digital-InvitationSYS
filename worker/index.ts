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
import { deleteStoredFiles } from '@/server/media/files';
import { markMediaFailed, processMedia, sweepMedia } from '@/server/media/processing';
import { getMediaQueue, MEDIA_QUEUE } from '@/server/queues/media-queue';
import { getRedis } from '@/server/redis';

/**
 * The background worker: runs the jobs of the "media" queue (src/server/queues/media-queue.ts)
 * and schedules the sweep. Start it with `npm run worker` (`npm run worker:dev` restarts on
 * changes). SIGTERM/SIGINT stop it gracefully: running jobs finish first.
 */

/** Jobs at once: image processing is CPU and memory heavy on small machines. */
const CONCURRENCY = 2;
const SWEEP_EVERY_MS = 5 * 60_000;
const SHUTDOWN_TIMEOUT_MS = 30_000;

const processMediaData = z.object({ mediaId: z.uuid() });
const deleteFilesData = z.object({
  keys: z.array(z.string().min(1)).max(1_000),
  prefixes: z.array(z.string().min(1)).max(1_000),
});

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
    default:
      throw new UnrecoverableError(`Unknown job "${job.name}"`);
  }
}

function isQuietResult(job: Job, result: unknown): boolean {
  if (job.name !== 'sweep-media') return false;
  const { requeued, removed } = result as Awaited<ReturnType<typeof sweepMedia>>;
  return requeued === 0 && removed === 0;
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
      if (job.name === 'process-media') {
        const data = processMediaData.safeParse(job.data);
        // Unmarked (database down), the media stays PENDING and the sweep queues it again.
        if (data.success) {
          await markMediaFailed(data.data.mediaId, 'error').catch((markErr: unknown) => {
            logger.warn('Could not mark the media as failed', { ...meta, err: markErr });
          });
        }
      }
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

  const queue = getMediaQueue();
  const worker = new Worker(MEDIA_QUEUE, runJob, {
    connection: {
      url: env.REDIS_URL,
      // Required by BullMQ for workers: commands wait for Redis to come back.
      maxRetriesPerRequest: null,
      connectionName: 'convites-worker',
    },
    concurrency: CONCURRENCY,
  });
  worker.on('error', (err) => logger.warn('Worker error', { err }));

  await queue.upsertJobScheduler(
    'sweep-media',
    { every: SWEEP_EVERY_MS },
    { name: 'sweep-media', data: {} },
  );
  logger.info('Worker started', { queue: MEDIA_QUEUE, concurrency: CONCURRENCY });

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
      await worker.close();
      await queue.close();
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
