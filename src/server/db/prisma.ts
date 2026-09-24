import 'server-only';

import { getServerEnv } from '@/env';
import { logger } from '@/lib/logger';
import { type AppPrismaClient, createPrismaClient } from '@/server/db/client';

/**
 * The web app's Prisma client: one per process (shared by every server bundle and kept across
 * dev hot reloads), created on first use so `next build` never needs a database.
 */

const CLIENT_KEY = Symbol.for('convites.prisma');

type GlobalWithPrisma = typeof globalThis & { [CLIENT_KEY]?: AppPrismaClient };

function create(): AppPrismaClient {
  const env = getServerEnv();
  const prisma = createPrismaClient({
    connectionString: env.DATABASE_URL,
    applicationName: `convites-${env.SERVICE_NAME}`,
    onPoolError: (err) => logger.warn('Postgres pool error', { err }),
  });
  prisma.$on('warn', (event) => {
    logger.warn('Prisma warning', { message: event.message, target: event.target });
  });
  // Failed queries also throw to the caller, which logs (and reports) them: warn level here
  // avoids reporting the same failure to Sentry twice.
  prisma.$on('error', (event) => {
    logger.warn('Prisma error', { message: event.message, target: event.target });
  });
  return prisma;
}

export function getPrisma(): AppPrismaClient {
  const g = globalThis as GlobalWithPrisma;
  g[CLIENT_KEY] ??= create();
  return g[CLIENT_KEY];
}

export async function pingDatabase(): Promise<void> {
  await getPrisma().$queryRaw`SELECT 1`;
}
