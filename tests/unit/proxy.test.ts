// Next 16.3 still ships this helper under its pre-rename name (the docs call it `unstable_doesProxyMatch`).
import { unstable_doesMiddlewareMatch as doesProxyMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getServerEnv } from '@/env';
import { uploadOrigin } from '@/lib/media/upload-origin';
import { RATE_LIMITS } from '@/server/rate-limit/policies';

import { config, proxy } from '../../proxy';

const rateLimit = vi.hoisted(() => vi.fn());
vi.mock('@/server/rate-limit/sliding-window', () => ({ rateLimit }));

beforeEach(() => {
  rateLimit.mockResolvedValue({ allowed: true, remaining: 10, retryAfterMs: 0, enforced: true });
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const GUEST_PAGE = 'http://localhost/c/ev/AbCdEfGhIjKlMnOp';

// Headers forwarded to the app with NextResponse.next({ request: { headers } }) are encoded like this.
const forwarded = (response: Response, name: string) =>
  response.headers.get(`x-middleware-request-${name}`);

describe('proxy', () => {
  it('sets a nonce-based CSP and forwards the nonce and request ID to the app', async () => {
    const response = await proxy(new NextRequest(GUEST_PAGE));

    const csp = response.headers.get('content-security-policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeDefined();
    expect(forwarded(response, 'x-nonce')).toBe(nonce);
    expect(forwarded(response, 'content-security-policy')).toBe(csp);

    const requestId = response.headers.get('x-request-id');
    expect(requestId).toMatch(UUID);
    expect(forwarded(response, 'x-request-id')).toBe(requestId);
  });

  it('lets pages upload to object storage (the dashboard is reached by client navigation)', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://convites:convites@localhost:5432/convites');
    vi.stubEnv('REDIS_URL', 'redis://localhost:6379');
    vi.stubEnv('BETTER_AUTH_SECRET', 'unit-test-secret-unit-test-secret-0123');
    vi.stubEnv('S3_ENDPOINT', 'https://account.r2.cloudflarestorage.com');
    vi.stubEnv('S3_BUCKET', 'convites-media');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'key-id');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 'secret');
    const expected = uploadOrigin(getServerEnv());
    expect(expected).toMatch(/^https:\/\//);

    const response = await proxy(new NextRequest('http://localhost/entrar'));
    expect(response.headers.get('content-security-policy')).toMatch(
      new RegExp(`connect-src 'self'[^;]* ${expected.replace(/\./g, '\\.')}(;| )`),
    );
  });

  it('uses a fresh nonce for every request', async () => {
    const first = await proxy(new NextRequest('http://localhost/'));
    const second = await proxy(new NextRequest('http://localhost/'));
    expect(first.headers.get('content-security-policy')).not.toBe(
      second.headers.get('content-security-policy'),
    );
  });

  it('keeps a well-formed upstream request ID and replaces a malformed one', async () => {
    const kept = await proxy(
      new NextRequest('http://localhost/', { headers: { 'x-request-id': 'caddy-req-12345678' } }),
    );
    expect(kept.headers.get('x-request-id')).toBe('caddy-req-12345678');

    const replaced = await proxy(
      new NextRequest('http://localhost/', { headers: { 'x-request-id': '<bad>' } }),
    );
    expect(replaced.headers.get('x-request-id')).toMatch(UUID);
  });

  it('runs for pages only', () => {
    const matches = (url: string, headers?: Record<string, string>) =>
      doesProxyMatch({ config, nextConfig: {}, url, headers });

    expect(matches('/')).toBe(true);
    expect(matches('/c/ev/AbCdEfGhIjKlMnOp')).toBe(true);
    expect(matches('/api/health')).toBe(false);
    expect(matches('/_next/static/chunks/app.js')).toBe(false);
    expect(matches('/monitoring')).toBe(false);
    expect(matches('/icon.svg')).toBe(false);
    expect(matches('/demo/musica.wav')).toBe(false);
    expect(matches('/', { 'next-router-prefetch': '1' })).toBe(false);
  });
});

describe('guest page rate limit', () => {
  it("counts guest page requests per client IP (the proxy's X-Forwarded-For entry)", async () => {
    await proxy(
      new NextRequest(GUEST_PAGE, {
        headers: { 'x-forwarded-for': '10.0.0.1, 203.0.113.9', 'user-agent': 'Mozilla/5.0' },
      }),
    );
    expect(rateLimit).toHaveBeenCalledWith(RATE_LIMITS.invitationPagesPerIp, '203.0.113.9');
  });

  it('answers 429 with a Retry-After over the limit', async () => {
    rateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterMs: 29_500,
      enforced: true,
    });
    const response = await proxy(new NextRequest(GUEST_PAGE));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('30');
    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'none'; style-src 'unsafe-inline'",
    );
    expect(await response.text()).toContain('Demasiados pedidos');
  });

  it('leaves other pages and link-preview bots alone', async () => {
    await proxy(new NextRequest('http://localhost/'));
    await proxy(
      new NextRequest(GUEST_PAGE, {
        headers: { 'user-agent': 'WhatsApp/2.24.1.0 A' },
      }),
    );
    expect(rateLimit).not.toHaveBeenCalled();
  });
});
