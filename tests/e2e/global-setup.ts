import { execSync } from 'node:child_process';

import { loadEnvConfig } from '@next/env';
import { Redis } from 'ioredis';

/**
 * Makes end-to-end runs repeatable against the local stack: re-seeds the demo data (every guest
 * back to its seeded RSVP) and clears the rate-limit counters, which would otherwise block
 * repeated RSVP submissions within ten minutes. Set E2E_SKIP_RESET=1 when testing a server whose
 * database and Redis are not the local ones.
 */
export default async function globalSetup(): Promise<void> {
  if (process.env.E2E_SKIP_RESET) return;
  loadEnvConfig(process.cwd());

  execSync('npm run db:seed', { stdio: 'ignore' });

  const url = process.env.REDIS_URL;
  if (!url) return;
  const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await redis.connect();
    const keys = await redis.keys('convites:rl:*');
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Redis down: the app then does not rate-limit either.
  } finally {
    redis.disconnect();
  }
}
