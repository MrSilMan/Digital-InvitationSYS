// Next 16.3 still ships this helper under its pre-rename name (the docs call it `unstable_doesProxyMatch`).
import { unstable_doesMiddlewareMatch as doesProxyMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from '../../proxy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Headers forwarded to the app with NextResponse.next({ request: { headers } }) are encoded like this.
const forwarded = (response: Response, name: string) =>
  response.headers.get(`x-middleware-request-${name}`);

describe('proxy', () => {
  it('sets a nonce-based CSP and forwards the nonce and request ID to the app', () => {
    const response = proxy(new NextRequest('http://localhost/c/ev/AbCdEfGhIjKlMnOp'));

    const csp = response.headers.get('content-security-policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeDefined();
    expect(forwarded(response, 'x-nonce')).toBe(nonce);
    expect(forwarded(response, 'content-security-policy')).toBe(csp);

    const requestId = response.headers.get('x-request-id');
    expect(requestId).toMatch(UUID);
    expect(forwarded(response, 'x-request-id')).toBe(requestId);
  });

  it('uses a fresh nonce for every request', () => {
    const first = proxy(new NextRequest('http://localhost/'));
    const second = proxy(new NextRequest('http://localhost/'));
    expect(first.headers.get('content-security-policy')).not.toBe(
      second.headers.get('content-security-policy'),
    );
  });

  it('keeps a well-formed upstream request ID and replaces a malformed one', () => {
    const kept = proxy(
      new NextRequest('http://localhost/', { headers: { 'x-request-id': 'caddy-req-12345678' } }),
    );
    expect(kept.headers.get('x-request-id')).toBe('caddy-req-12345678');

    const replaced = proxy(
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
    expect(matches('/', { 'next-router-prefetch': '1' })).toBe(false);
  });
});
