import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, createNonce } from '@/lib/security/csp';

describe('Content-Security-Policy', () => {
  it('only allows scripts carrying the nonce in production', () => {
    const csp = buildContentSecurityPolicy({
      nonce: 'abc123',
      isDev: false,
      upgradeInsecureRequests: true,
    });

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic';");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toMatch(/upgrade-insecure-requests$/);
  });

  it('adds eval and websockets for the development server only', () => {
    const csp = buildContentSecurityPolicy({
      nonce: 'n',
      isDev: true,
      upgradeInsecureRequests: false,
    });

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' ws: wss:");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('accepts extra origins for storage', () => {
    const csp = buildContentSecurityPolicy({
      nonce: 'n',
      isDev: false,
      upgradeInsecureRequests: false,
      connectSrc: ['https://media.convites.ao'],
      imgSrc: ['https://media.convites.ao'],
    });

    expect(csp).toContain("connect-src 'self' https://media.convites.ao");
    expect(csp).toContain("img-src 'self' data: blob: https://media.convites.ao");
  });

  it('creates unpredictable 128-bit base64 nonces', () => {
    const nonce = createNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(createNonce()).not.toBe(nonce);
  });
});
