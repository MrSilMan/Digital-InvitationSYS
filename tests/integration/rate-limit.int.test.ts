import type { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { rateLimit, rateLimitKey } from '@/server/rate-limit/sliding-window';

import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';

const policy = { name: 'test-limit', limit: 3, windowMs: 60_000 };
let redis: Redis;

beforeAll(async () => {
  await flushTestRedis();
  redis = await connectAppRedis();
});

afterAll(async () => {
  await closeAppRedis();
});

describe('sliding-window rate limiter', () => {
  it('allows `limit` requests per window, then refuses with the wait time', async () => {
    const now = 1_000_000;
    const results = [];
    for (let index = 0; index < 4; index += 1) {
      results.push(await rateLimit(policy, 'subject-a', { now: now + index * 1_000, redis }));
    }
    expect(results.map((result) => [result.allowed, result.remaining])).toEqual([
      [true, 2],
      [true, 1],
      [true, 0],
      [false, 0],
    ]);
    // The oldest request (at `now`) leaves the window 60 s later: 57 s after the 4th request.
    expect(results[3]).toMatchObject({ enforced: true, retryAfterMs: 57_000 });
  });

  it('slides: requests are allowed again as old ones leave the window', async () => {
    const now = 5_000_000;
    for (let index = 0; index < 3; index += 1) {
      await rateLimit(policy, 'subject-b', { now: now + index, redis });
    }
    expect((await rateLimit(policy, 'subject-b', { now: now + 59_999, redis })).allowed).toBe(
      false,
    );
    expect((await rateLimit(policy, 'subject-b', { now: now + 60_001, redis })).allowed).toBe(true);
  });

  it('counts subjects separately and stores no raw subject in Redis', async () => {
    const now = 9_000_000;
    await rateLimit(policy, '203.0.113.9', { now, redis });
    expect((await rateLimit(policy, '198.51.100.7', { now, redis })).remaining).toBe(2);
    const keys = await redis.keys('convites:rl:*');
    expect(keys).toContain(rateLimitKey(policy, '203.0.113.9'));
    expect(keys.join(' ')).not.toContain('203.0.113.9');
  });

  it('is exact under concurrency (one atomic script per request)', async () => {
    const concurrent = { ...policy, name: 'test-concurrent', limit: 10 };
    const now = 12_000_000;
    const results = await Promise.all(
      Array.from({ length: 25 }, () => rateLimit(concurrent, 'burst', { now, redis })),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(10);
  });

  it('lets requests through, unenforced, when Redis is unavailable', async () => {
    expect(await rateLimit(policy, 'subject-c', { redis: null })).toEqual({
      allowed: true,
      remaining: 3,
      retryAfterMs: 0,
      enforced: false,
    });
  });
});
