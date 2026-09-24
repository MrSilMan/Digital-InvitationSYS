import 'server-only';

import { randomUUID } from 'node:crypto';

import type { Redis } from 'ioredis';

import { hashKeyPart, KEY_PREFIX } from '@/server/cache/json-cache';
import { withRedis } from '@/server/redis';

/**
 * Sliding-window rate limiter (a log of request times in a sorted set, per policy and subject).
 * One Lua script does the whole check atomically, so concurrent requests are counted exactly.
 * When Redis is unavailable the request is allowed (`enforced: false`): guests keep access and
 * the failure is logged (see withRedis).
 */

export interface RateLimitPolicy {
  /** Part of the Redis key, e.g. "rsvp-token". */
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** When not allowed: how long until the oldest counted request leaves the window. */
  retryAfterMs: number;
  /** False when Redis was unavailable and nothing was counted. */
  enforced: boolean;
}

const SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count < limit then
  redis.call('ZADD', key, now, ARGV[4])
  redis.call('PEXPIRE', key, window)
  return {1, limit - count - 1, 0}
end
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
return {0, 0, math.max(0, window - (now - tonumber(oldest[2])))}
`;

const COMMAND = 'convitesSlidingWindow';

type ScriptClient = Redis & {
  [COMMAND]: (
    key: string,
    now: number,
    windowMs: number,
    limit: number,
    member: string,
  ) => Promise<[number, number, number]>;
};

/** Registers the script once per client (ioredis then runs it with EVALSHA). */
function withScript(redis: Redis): ScriptClient {
  const client = redis as ScriptClient;
  if (typeof client[COMMAND] !== 'function') {
    redis.defineCommand(COMMAND, { numberOfKeys: 1, lua: SCRIPT });
  }
  return client;
}

export function rateLimitKey(policy: RateLimitPolicy, subject: string): string {
  return `${KEY_PREFIX}rl:${policy.name}:${hashKeyPart(subject)}`;
}

/**
 * Counts one request by `subject` (an IP address, a guest token…) against `policy`. The subject is
 * hashed in the key: neither tokens nor IP addresses are stored in Redis.
 */
export async function rateLimit(
  policy: RateLimitPolicy,
  subject: string,
  options: { now?: number; redis?: Redis | null } = {},
): Promise<RateLimitResult> {
  const now = options.now ?? Date.now();
  const unenforced: RateLimitResult = {
    allowed: true,
    remaining: policy.limit,
    retryAfterMs: 0,
    enforced: false,
  };
  return withRedis(
    `rate limit ${policy.name}`,
    async (redis) => {
      const [allowed, remaining, retryAfterMs] = await withScript(redis)[COMMAND](
        rateLimitKey(policy, subject),
        now,
        policy.windowMs,
        policy.limit,
        `${now}:${randomUUID()}`,
      );
      return { allowed: allowed === 1, remaining, retryAfterMs, enforced: true };
    },
    unenforced,
    options.redis,
  );
}
