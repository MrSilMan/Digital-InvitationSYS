import { describe, expect, it } from 'vitest';

import { PASSWORD_MIN_LENGTH } from '@/lib/validation/auth';

import { generateTemporaryPassword, hashPassword, verifyPassword } from './passwords';

describe('generateTemporaryPassword', () => {
  it('gives three groups of four unambiguous characters', () => {
    for (let i = 0; i < 50; i += 1) {
      const password = generateTemporaryPassword();
      expect(password).toMatch(/^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/);
      expect(password.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    }
  });

  it('does not repeat itself', () => {
    const passwords = new Set(Array.from({ length: 200 }, generateTemporaryPassword));
    expect(passwords.size).toBe(200);
  });
});

describe('hashPassword', () => {
  it('stores a salted hash that only the same password verifies', async () => {
    const password = generateTemporaryPassword();
    const [first, second] = await Promise.all([hashPassword(password), hashPassword(password)]);
    expect(first).not.toContain(password);
    expect(first).not.toBe(second);
    await expect(verifyPassword({ hash: first, password })).resolves.toBe(true);
    await expect(verifyPassword({ hash: first, password: `${password}x` })).resolves.toBe(false);
  });
});
