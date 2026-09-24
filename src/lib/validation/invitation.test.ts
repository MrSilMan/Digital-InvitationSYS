import { describe, expect, it } from 'vitest';

import { invitationParamsSchema, isEventSlug } from '@/lib/validation/invitation';

describe('guest link parameters', () => {
  it('accept a real slug and token', () => {
    expect(
      invitationParamsSchema.safeParse({
        eventSlug: 'braulio-e-nanda',
        guestToken: 'x3KfZ0bq_5d-Ht9wLmNpQa',
      }).success,
    ).toBe(true);
  });

  it.each([
    ['uppercase', 'Braulio-e-Nanda'],
    ['a leading hyphen', '-braulio'],
    ['a double hyphen', 'braulio--nanda'],
    ['a path', 'braulio/../x'],
    ['an accent', 'braúlio'],
    ['too long', 'a'.repeat(81)],
  ])('reject a slug with %s', (_case, slug) => {
    expect(isEventSlug(slug)).toBe(false);
  });

  it.each(['short', 'has spaces in it ok?', 'a'.repeat(65), "x'; DROP TABLE guest;--"])(
    'reject the token %s',
    (guestToken) => {
      expect(
        invitationParamsSchema.safeParse({ eventSlug: 'braulio-e-nanda', guestToken }).success,
      ).toBe(false);
    },
  );
});
