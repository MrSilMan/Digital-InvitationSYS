import 'server-only';

import { logger } from '@/lib/logger';

/**
 * Health report for `/api/health` (Docker HEALTHCHECK, deploy verification, uptime monitors).
 *
 * - `ok`: every dependency is up.
 * - `degraded`: Redis is down — the app keeps working (cache and rate limits fall back), HTTP 200.
 * - `down`: the database is down — the app cannot serve invitations, HTTP 503.
 *
 * Failure details stay in the logs; the public response only says `timeout` or `unavailable`.
 */

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface DependencyCheck {
  status: 'up' | 'down';
  latencyMs: number;
  error?: 'timeout' | 'unavailable';
}

export interface HealthReport {
  status: HealthStatus;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    database: DependencyCheck;
    redis: DependencyCheck;
  };
}

export interface HealthProbes {
  database: () => Promise<unknown>;
  redis: () => Promise<unknown>;
}

export const DEFAULT_CHECK_TIMEOUT_MS = 1_500;

class ProbeTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Probe timed out after ${timeoutMs}ms`);
    this.name = 'ProbeTimeoutError';
  }
}

export async function checkDependency(
  name: string,
  probe: () => Promise<unknown>,
  timeoutMs = DEFAULT_CHECK_TIMEOUT_MS,
): Promise<DependencyCheck> {
  const startedAt = performance.now();
  const elapsed = () => Math.round((performance.now() - startedAt) * 10) / 10;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      probe(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ProbeTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
    return { status: 'up', latencyMs: elapsed() };
  } catch (err) {
    const timedOut = err instanceof ProbeTimeoutError;
    logger.warn('Health check failed', { dependency: name, timedOut, err });
    return { status: 'down', latencyMs: elapsed(), error: timedOut ? 'timeout' : 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

export async function buildHealthReport(
  probes: HealthProbes,
  options: { version: string; timeoutMs?: number },
): Promise<HealthReport> {
  const [database, redis] = await Promise.all([
    checkDependency('database', probes.database, options.timeoutMs),
    checkDependency('redis', probes.redis, options.timeoutMs),
  ]);
  const status: HealthStatus =
    database.status === 'down' ? 'down' : redis.status === 'down' ? 'degraded' : 'ok';
  return {
    status,
    version: options.version,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database, redis },
  };
}

export function healthHttpStatus(report: HealthReport): 200 | 503 {
  return report.status === 'down' ? 503 : 200;
}
