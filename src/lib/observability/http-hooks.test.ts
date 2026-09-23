import { once } from 'node:events';
import { createServer, get, type IncomingHttpHeaders } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { logger } from '@/lib/logger';
import { installHttpRequestHooks } from '@/lib/observability/http-hooks';
import { getRequestId } from '@/lib/request-context';

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn() } }));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface Observation {
  header: string | undefined;
  atStart: string | undefined;
  afterAwait: string | undefined;
}

const observations: Observation[] = [];

// A plain Node server stands in for Next.js: the hook must work for any `http` server.
const server = createServer((req, res) => {
  const header = req.headers['x-request-id'] as string | undefined;
  const atStart = getRequestId();
  setTimeout(() => {
    void Promise.resolve().then(() => {
      observations.push({ header, atStart, afterAwait: getRequestId() });
      res.statusCode = req.url === '/missing' ? 404 : 200;
      res.end('ok');
    });
  }, 10);
});

function request(
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; headers: IncomingHttpHeaders }> {
  const { port } = server.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    get({ host: '127.0.0.1', port, path, headers }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers }));
    }).on('error', reject);
  });
}

beforeAll(async () => {
  installHttpRequestHooks();
  installHttpRequestHooks(); // idempotent
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
});

afterAll(() => {
  server.close();
});

describe('HTTP request hooks', () => {
  it('gives every request its own ID, visible across async work, and echoes it back', async () => {
    const responses = await Promise.all([
      request('/c/ev/AbCdEfGhIjKlMnOp'),
      request('/missing', { 'x-request-id': 'caddy-req-12345678' }),
      request('/other', { 'x-request-id': 'bad id' }),
    ]);

    expect(observations).toHaveLength(3);
    for (const observation of observations) {
      expect(observation.header).toBeDefined();
      expect(observation.atStart).toBe(observation.header);
      expect(observation.afterAwait).toBe(observation.header);
    }
    expect(new Set(observations.map((o) => o.header)).size).toBe(3);

    expect(responses[0]?.headers['x-request-id']).toMatch(UUID);
    expect(responses[1]?.headers['x-request-id']).toBe('caddy-req-12345678');
    expect(responses[2]?.headers['x-request-id']).toMatch(UUID);
  });

  it('writes one access log line per request with method, path, status and duration', async () => {
    const log = vi.mocked(logger.log);

    await request('/missing', { 'x-request-id': 'caddy-req-87654321' });
    await request('/api/health');
    await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(2));

    expect(log).toHaveBeenCalledWith(
      'http',
      expect.stringMatching(/^GET \/missing 404 \d+(\.\d+)?ms$/),
      expect.objectContaining({
        requestId: 'caddy-req-87654321',
        method: 'GET',
        path: '/missing',
        status: 404,
        durationMs: expect.any(Number),
      }),
    );
    // Health probes and static assets are logged at debug level to keep the logs readable.
    expect(log).toHaveBeenCalledWith(
      'debug',
      expect.stringContaining('/api/health'),
      expect.anything(),
    );
  });
});
