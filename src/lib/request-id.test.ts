import { describe, expect, it } from 'vitest';

import { createRequestId, isValidRequestId, resolveRequestId } from '@/lib/request-id';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('request IDs', () => {
  it('creates random UUIDs', () => {
    const a = createRequestId();
    expect(a).toMatch(UUID);
    expect(createRequestId()).not.toBe(a);
  });

  it('accepts well-formed IDs and rejects malformed ones', () => {
    expect(isValidRequestId('5f0c7a2e-4b1d-4c7e-9a3f-2d8e1b6c9f00')).toBe(true);
    expect(isValidRequestId('caddy-req-12345678')).toBe(true);
    expect(isValidRequestId('short')).toBe(false);
    expect(isValidRequestId('has space inside')).toBe(false);
    expect(isValidRequestId('x'.repeat(200))).toBe(false);
    expect(isValidRequestId(undefined)).toBe(false);
  });

  it('reuses a valid incoming ID and replaces anything else', () => {
    expect(resolveRequestId('caddy-req-12345678')).toBe('caddy-req-12345678');
    expect(resolveRequestId(['caddy-req-12345678', 'other-req-1234'])).toBe('caddy-req-12345678');
    expect(resolveRequestId('<script>')).toMatch(UUID);
    expect(resolveRequestId(null)).toMatch(UUID);
  });
});
