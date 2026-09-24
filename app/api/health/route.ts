import { getServerEnv } from '@/env';
import { pingDatabase } from '@/server/db/prisma';
import { buildHealthReport, healthHttpStatus } from '@/server/health';
import { pingRedis } from '@/server/redis';

export const dynamic = 'force-dynamic';

/** Liveness/readiness for Docker, the deploy script and uptime monitors. See `src/server/health.ts`. */
export async function GET(): Promise<Response> {
  const report = await buildHealthReport(
    { database: pingDatabase, redis: pingRedis },
    { version: getServerEnv().APP_RELEASE },
  );
  return Response.json(report, {
    status: healthHttpStatus(report),
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
