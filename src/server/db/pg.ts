import 'server-only';

import { Pool } from 'pg';

import { getServerEnv } from '@/env';
import { logger } from '@/lib/logger';

/**
 * Minimal Postgres pool used only by the health check.
 * Phase 2 replaces it with the Prisma client (which uses `pg` through `@prisma/adapter-pg`).
 */

const POOL_KEY = Symbol.for('convites.pgPool');

type GlobalWithPool = typeof globalThis & { [POOL_KEY]?: Pool };

function createPool(): Pool {
  const env = getServerEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 2_000,
    idleTimeoutMillis: 30_000,
    query_timeout: 2_000,
    allowExitOnIdle: true,
    application_name: `convites-${env.SERVICE_NAME}`,
  });
  // An idle client losing its connection must not crash the process.
  pool.on('error', (err) => logger.warn('Postgres idle client error', { err }));
  return pool;
}

export function getPgPool(): Pool {
  const g = globalThis as GlobalWithPool;
  g[POOL_KEY] ??= createPool();
  return g[POOL_KEY];
}

export async function pingDatabase(): Promise<void> {
  await getPgPool().query('SELECT 1');
}
