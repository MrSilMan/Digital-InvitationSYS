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

export async function pingRedis(): Promise<void> {
  const reply = await getRedis().ping();
  if (reply !== 'PONG') throw new Error(`Unexpected Redis PING reply: ${reply}`);
}
