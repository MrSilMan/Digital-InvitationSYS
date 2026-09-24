import 'server-only';

import { Redis } from 'ioredis';

import { getServerEnv } from '@/env';
import { logger } from '@/lib/logger';

/**
 * Shared Redis client for the web app (cache, rate limiting, view de-duplication).
 * BullMQ uses its own connections (it requires `maxRetriesPerRequest: null`).
 *
 * Redis is optional at runtime: commands fail fast when it is down so callers can fall back to
 * Postgres, and connection errors are logged at most every 30 seconds.
 */

const CLIENT_KEY = Symbol.for('convites.redis');
const ERROR_LOG_INTERVAL_MS = 30_000;

type GlobalWithRedis = typeof globalThis & { [CLIENT_KEY]?: Redis };

function createRedisClient(): Redis {
  const env = getServerEnv();
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2_000,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => Math.min(attempt * 250, 5_000),
    connectionName: `convites-${env.SERVICE_NAME}`,
  });

  let connected = false;
  let lostAt: number | undefined;
  let lastErrorLogAt = 0;
  let suppressedErrors = 0;

  client.on('ready', () => {
    connected = true;
    if (lostAt !== undefined) {
      logger.info('Redis connection restored', { downForMs: Date.now() - lostAt });
      lostAt = undefined;
    }
  });

  // A lost connection shows up as `close` (e.g. a proxy accepting then dropping the socket)
  // or as `error` (connection refused, timeout): log both, without flooding the logs.
  client.on('close', () => {
    if (!connected) return;
    connected = false;
    lostAt = Date.now();
    logger.warn('Redis connection lost, continuing without it');
  });

  client.on('error', (err: Error) => {
    const now = Date.now();
    if (now - lastErrorLogAt < ERROR_LOG_INTERVAL_MS) {
      suppressedErrors += 1;
      return;
    }
    logger.warn('Redis error', { err, suppressedErrors });
    lastErrorLogAt = now;
    suppressedErrors = 0;
  });

  return client;
}

export function getRedis(): Redis {
  const g = globalThis as GlobalWithRedis;
  g[CLIENT_KEY] ??= createRedisClient();
  return g[CLIENT_KEY];
}

/**
 * The client if it is connected right now, else null, without waiting: callers then skip Redis
 * (cache miss, no rate limit, Postgres fallback) instead of queueing behind a reconnect. The
 * first call starts the lazy connection in the background.
 */
export function getReadyRedis(): Redis | null {
  const client = getRedis();
  if (client.status === 'ready') return client;
  if (client.status === 'wait') void client.connect().catch(() => {});
  return null;
}

/** Longest a Redis command may take on a request path before we carry on without it. */
const COMMAND_TIMEOUT_MS = 250;
const warnedAt = new Map<string, number>();

/**
 * Runs `operation` against Redis when it is available, within COMMAND_TIMEOUT_MS; otherwise, or on
 * any error, returns `fallback`. Failures are logged at most every 30 seconds per `what`.
 * `redis` overrides the shared client (tests pass null to simulate an outage).
 */
export async function withRedis<T>(
  what: string,
  operation: (redis: Redis) => Promise<T>,
  fallback: T,
  redis: Redis | null = getReadyRedis(),
): Promise<T> {
  if (!redis) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(redis),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Redis ${what} timed out after ${COMMAND_TIMEOUT_MS} ms`)),
          COMMAND_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (err) {
    const now = Date.now();
    if (now - (warnedAt.get(what) ?? 0) >= ERROR_LOG_INTERVAL_MS) {
      warnedAt.set(what, now);
      logger.warn('Redis operation failed, continuing without it', { what, err });
    }
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export async function pingRedis(): Promise<void> {
  const reply = await getRedis().ping();
  if (reply !== 'PONG') throw new Error(`Unexpected Redis PING reply: ${reply}`);
}
