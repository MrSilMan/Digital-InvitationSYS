import 'server-only';

import { createHash } from 'node:crypto';

import type { Redis } from 'ioredis';

import { logger } from '@/lib/logger';
import { withRedis } from '@/server/redis';

/**
 * A small JSON cache on Redis. Every call degrades to "miss" / no-op when Redis is unavailable, so
 * callers always have a Postgres path. Keys are namespaced (`convites:`), and anything secret or
 * personal in a key (guest tokens, IP addresses) goes through `hashKeyPart` first.
 */

export const KEY_PREFIX = 'convites:';

/** Short, stable, non-reversible stand-in for a secret or personal value in a Redis key. */
export function hashKeyPart(value: string): string {
  return createHash('sha256').update(value).digest('base64url').slice(0, 32);
}

export async function cacheGet<T>(key: string, redis?: Redis | null): Promise<T | undefined> {
  const raw = await withRedis('cache get', (client) => client.get(KEY_PREFIX + key), null, redis);
  if (raw === null) {
    logger.debug('Cache miss', { key });
    return undefined;
  }
  try {
    const value = JSON.parse(raw) as T;
    logger.debug('Cache hit', { key });
    return value;
  } catch {
    logger.warn('Unreadable cache entry, ignoring it', { key });
    return undefined;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
  redis?: Redis | null,
): Promise<void> {
  await withRedis(
    'cache set',
    (client) => client.set(KEY_PREFIX + key, JSON.stringify(value), 'EX', ttlSeconds),
    null,
    redis,
  );
}

export async function cacheDelete(keys: readonly string[], redis?: Redis | null): Promise<void> {
  if (keys.length === 0) return;
  await withRedis(
    'cache delete',
    (client) => client.del(...keys.map((key) => KEY_PREFIX + key)),
    0,
    redis,
  );
}
