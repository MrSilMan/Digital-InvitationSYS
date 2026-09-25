import { describe, expect, it } from 'vitest';

import { accountSchema, ADMIN_LIMITS, guestLimitSchema, newEventSchema } from './admin';

const validEvent = {
  owner: { kind: 'existing', userId: 'user-1' },
  groomName: ' Braúlio ',
  brideName: 'Nanda',
  date: '2027-01-15',
  time: '16:00',
  slug: ' Braulio-E-Nanda ',
  themeId: 'praia-rosa',
  guestLimit: '150',
} as const;

describe('accountSchema', () => {
  it('tidies the name and lowercases the e-mail', () => {
    expect(
      accountSchema.parse({ name: '  Braúlio   e Nanda ', email: ' Noivos@Exemplo.AO ' }),
    ).toEqual({ name: 'Braúlio e Nanda', email: 'noivos@exemplo.ao' });
  });

  it('requires a name and a valid e-mail', () => {
    const result = accountSchema.safeParse({ name: '  ', email: 'noivos' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.')).sort()).toEqual([
      'email',
      'name',
    ]);
  });
});

describe('guestLimitSchema', () => {
  it('takes whole numbers from 1 to the largest plan', () => {
    expect(guestLimitSchema.parse(' 150 ')).toBe(150);
    expect(guestLimitSchema.parse(String(ADMIN_LIMITS.guestLimit))).toBe(ADMIN_LIMITS.guestLimit);
    for (const value of ['0', '-5', '1.5', 'abc', '', String(ADMIN_LIMITS.guestLimit + 1)]) {
      expect(guestLimitSchema.safeParse(value).success, value).toBe(false);
    }
  });
});

describe('newEventSchema', () => {
  it('returns database-ready data: the ceremony instant in UTC, a lowercase slug', () => {
    expect(newEventSchema.parse(validEvent)).toEqual({
      owner: { kind: 'existing', userId: 'user-1' },
      groomName: 'Braúlio',
      brideName: 'Nanda',
      slug: 'braulio-e-nanda',
      themeId: 'praia-rosa',
      guestLimit: 150,
      // 16:00 in Luanda (UTC+1).
      startsAt: new Date('2027-01-15T15:00:00.000Z'),
    });
  });

  it('creates the account with the event when asked', () => {
    const parsed = newEventSchema.parse({
      ...validEvent,
      owner: { kind: 'new', name: 'Ana e João', email: 'ANA@exemplo.ao', userId: '' },
    });
    expect(parsed.owner).toEqual({ kind: 'new', name: 'Ana e João', email: 'ana@exemplo.ao' });
  });

  it('points each problem at its field', () => {
    const result = newEventSchema.safeParse({
      ...validEvent,
      owner: { kind: 'existing', userId: '' },
      slug: 'Braúlio e Nanda',
      date: '2027-02-30',
      themeId: 'neon',
    });
    expect(result.error?.issues.map((issue) => issue.path.join('.')).sort()).toEqual([
      'date',
      'owner.userId',
      'slug',
      'themeId',
    ]);
  });
});
