import { Redis } from 'ioredis';

import { getRedis } from '@/server/redis';

/** Throws unless the URL selects a Redis database other than 0 (dev data lives in 0). */
export function assertTestRedis(url: string | undefined): string {
  if (!url) throw new Error('REDIS_URL is not set for the integration tests.');
  const database = Number(new URL(url).pathname.replace(/^\//, '') || '0');
  if (!Number.isInteger(database) || database < 1) {
    throw new Error(`Refusing to use Redis database ${database} for tests: use e.g. /15.`);
  }
  return url;
}

/** Empties the test Redis database. */
export async function flushTestRedis(): Promise<void> {
  const client = new Redis(assertTestRedis(process.env.REDIS_URL), { lazyConnect: true });
  try {
    await client.connect();
    await client.flushdb();
  } finally {
    client.disconnect();
  }
}

/** Connects the app's shared client (lazy by default), so getReadyRedis() returns it. */
export async function connectAppRedis(): Promise<Redis> {
  assertTestRedis(process.env.REDIS_URL);
  const client = getRedis();
  if (client.status === 'wait') await client.connect();
  return client;
}

/** Closes the app's shared client and forgets it, so the next test file starts fresh. */
export async function closeAppRedis(): Promise<void> {
  const key = Symbol.for('convites.redis');
  const g = globalThis as typeof globalThis & { [key: symbol]: Redis | undefined };
  await g[key]?.quit().catch(() => {});
  delete g[key];
}
