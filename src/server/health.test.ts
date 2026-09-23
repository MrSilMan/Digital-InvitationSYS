import { describe, expect, it, vi } from 'vitest';

import { buildHealthReport, healthHttpStatus } from '@/server/health';

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

const up = () => Promise.resolve();
const failing = () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.5:5432'));
const hanging = () => new Promise<never>(() => {});

describe('health report', () => {
  it('is ok (200) when every dependency is up', async () => {
    const report = await buildHealthReport({ database: up, redis: up }, { version: 'abc1234' });

    expect(report).toMatchObject({
      status: 'ok',
      version: 'abc1234',
      checks: { database: { status: 'up' }, redis: { status: 'up' } },
    });
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(healthHttpStatus(report)).toBe(200);
  });

  it('is degraded (still 200) when only Redis is down', async () => {
    const report = await buildHealthReport({ database: up, redis: failing }, { version: 'v' });

    expect(report.status).toBe('degraded');
    expect(report.checks.redis).toMatchObject({ status: 'down', error: 'unavailable' });
    expect(healthHttpStatus(report)).toBe(200);
  });

  it('is down (503) when the database is down', async () => {
    const report = await buildHealthReport({ database: failing, redis: up }, { version: 'v' });

    expect(report.status).toBe('down');
    expect(healthHttpStatus(report)).toBe(503);
  });

  it('times out probes that hang', async () => {
    const report = await buildHealthReport(
      { database: hanging, redis: up },
      { version: 'v', timeoutMs: 20 },
    );

    expect(report.checks.database).toMatchObject({ status: 'down', error: 'timeout' });
  });

  it('never exposes failure details publicly', async () => {
    const report = await buildHealthReport({ database: failing, redis: failing }, { version: 'v' });
    expect(JSON.stringify(report)).not.toContain('ECONNREFUSED');
  });
});
