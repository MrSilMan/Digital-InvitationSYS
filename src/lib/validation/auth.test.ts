import { describe, expect, it } from 'vitest';

import { changePasswordSchema, loginSchema, PASSWORD_MIN_LENGTH } from './auth';

describe('loginSchema', () => {
  it('compares e-mail addresses in lower case', () => {
    expect(loginSchema.parse({ email: ' Noivos@Convites.TEST ', password: 'x' }).email).toBe(
      'noivos@convites.test',
    );
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'k7mq-9xrt-2hpd',
    newPassword: 'a nossa festa na praia',
    confirmPassword: 'a nossa festa na praia',
  };

  it('accepts a new password typed twice', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['too short', { newPassword: 'curta', confirmPassword: 'curta' }, 'newPassword'],
    ['typed differently', { confirmPassword: 'a nossa festa na praia!' }, 'confirmPassword'],
    [
      'the same as the current one',
      { newPassword: valid.currentPassword, confirmPassword: valid.currentPassword },
      'newPassword',
    ],
    ['missing the current one', { currentPassword: '' }, 'currentPassword'],
  ])('refuses a password %s', (_, change, path) => {
    const result = changePasswordSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain(path);
  });

  it('asks for at least the minimum length', () => {
    const exact = 'x'.repeat(PASSWORD_MIN_LENGTH);
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: exact, confirmPassword: exact })
        .success,
    ).toBe(true);
  });
});
