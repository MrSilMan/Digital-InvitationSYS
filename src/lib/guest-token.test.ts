import { describe, expect, it, vi } from 'vitest';

import { createGuestToken, GUEST_TOKEN_LENGTH, isGuestToken } from '@/lib/guest-token';

describe('guest tokens', () => {
  it('are 22 URL-safe characters', () => {
    for (let i = 0; i < 200; i += 1) {
      const token = createGuestToken();
      expect(token).toHaveLength(GUEST_TOKEN_LENGTH);
      expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    }
  });

  it('do not repeat', () => {
    const tokens = new Set(Array.from({ length: 10_000 }, () => createGuestToken()));
    expect(tokens.size).toBe(10_000);
  });

  it('come from the cryptographically secure generator (16 bytes = 128 bits)', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    createGuestToken();
    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0]?.[0] as Uint8Array).byteLength).toBe(16);
  });

  it('encode bytes as base64url without padding', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      if (array instanceof Uint8Array) array.fill(0xfb);
      return array;
    });
    // 0xfb bytes → '+' / '/' in plain base64; base64url uses '-' / '_'.
    expect(createGuestToken()).toBe('-_v7-_v7-_v7-_v7-_v7-w');
  });

  it('are recognised before any database lookup', () => {
    expect(isGuestToken(createGuestToken())).toBe(true);
    expect(isGuestToken('demo-familia-silva-001')).toBe(true);
    expect(isGuestToken('short')).toBe(false);
    expect(isGuestToken('has/slash-and-more-characters')).toBe(false);
    expect(isGuestToken('x'.repeat(65))).toBe(false);
    expect(isGuestToken(undefined)).toBe(false);
  });
});
