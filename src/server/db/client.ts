import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Creates a Prisma client on the `pg` driver adapter (required by Prisma 7).
 *
 * Shared by the web app (`src/server/db/prisma.ts`), the seed script and the integration tests,
 * which run outside Next.js — that is why this module does not import 'server-only'.
 */
export interface CreatePrismaClientOptions {
  connectionString: string;
  /** Shown in `pg_stat_activity`, e.g. "convites-web". */
  applicationName?: string;
  maxConnections?: number;
  onPoolError?: (err: Error) => void;
}

export function createPrismaClient(options: CreatePrismaClientOptions) {
  const adapter = new PrismaPg(
    {
      connectionString: options.connectionString,
      max: options.maxConnections ?? 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      application_name: options.applicationName ?? 'convites',
    },
    { onPoolError: options.onPoolError },
  );
  return new PrismaClient({
    adapter,
    // Emitted as events (never printed): the web app forwards them to the logger.
    log: [
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });
}

export type AppPrismaClient = ReturnType<typeof createPrismaClient>;
