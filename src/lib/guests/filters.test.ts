import { describe, expect, it } from 'vitest';

import {
  compareGuestNames,
  type FilterableGuest,
  guestFilterQuery,
  guestGroups,
  matchesGuestFilters,
  NO_FILTERS,
  parseGuestFilters,
  searchKey,
} from '@/lib/guests/filters';

function guest(change: Partial<FilterableGuest> = {}): FilterableGuest {
  return {
    displayName: 'Família Silva',
    phone: '+244923456789',
    groupTag: 'Amigos',
    seatsAllowed: 2,
    sentAt: null,
    viewCount: 0,
    rsvp: null,
    ...change,
  };
}

describe('guest filters in the URL', () => {
  it('round-trips through the Portuguese query string', () => {
    const filters = {
      answer: 'declined',
      invite: 'not-sent',
      group: 'Família da noiva',
      query: 'silva',
    } as const;
    const query = guestFilterQuery(filters);
    expect(query).toBe('?resposta=nao-vao&convite=por-enviar&grupo=Fam%C3%ADlia+da+noiva&q=silva');
    expect(parseGuestFilters(Object.fromEntries(new URLSearchParams(query)))).toEqual(filters);
  });

  it('ignores unknown or missing values', () => {
    expect(
      parseGuestFilters({ resposta: 'talvez', convite: ['enviados', 'x'], grupo: ' ' }),
    ).toEqual({ ...NO_FILTERS, invite: 'sent' });
    expect(guestFilterQuery(NO_FILTERS)).toBe('');
  });
});

describe('matching guests', () => {
  it('filters by answer, invitation and group', () => {
    const confirmed = guest({ rsvp: { attending: true, peopleCount: 2, whatsappIntentAt: null } });
    expect(matchesGuestFilters(confirmed, { ...NO_FILTERS, answer: 'confirmed' })).toBe(true);
    expect(matchesGuestFilters(confirmed, { ...NO_FILTERS, answer: 'pending' })).toBe(false);
    expect(matchesGuestFilters(guest(), { ...NO_FILTERS, invite: 'not-sent' })).toBe(true);
    expect(
      matchesGuestFilters(guest({ sentAt: '2026-09-20' }), { ...NO_FILTERS, invite: 'sent' }),
    ).toBe(true);
    expect(
      matchesGuestFilters(guest({ viewCount: 1 }), { ...NO_FILTERS, invite: 'not-opened' }),
    ).toBe(false);
    expect(matchesGuestFilters(guest(), { ...NO_FILTERS, group: 'Colegas' })).toBe(false);
  });

  it('searches names without caring about accents or case, word by word', () => {
    const filters = (query: string) => ({ ...NO_FILTERS, query });
    expect(matchesGuestFilters(guest(), filters('FAMILIA'))).toBe(true);
    expect(matchesGuestFilters(guest(), filters('silva fam'))).toBe(true);
    expect(matchesGuestFilters(guest(), filters('silva neto'))).toBe(false);
  });

  it('searches phone digits, however they are typed', () => {
    const filters = (query: string) => ({ ...NO_FILTERS, query });
    expect(matchesGuestFilters(guest(), filters('923 456'))).toBe(true);
    expect(matchesGuestFilters(guest(), filters('111 222'))).toBe(false);
    expect(matchesGuestFilters(guest({ phone: null }), filters('923'))).toBe(false);
  });
});

describe('helpers', () => {
  it('strips accents for search', () => {
    expect(searchKey('Família Conceição')).toBe('familia conceicao');
  });

  it('lists groups once, alphabetically', () => {
    expect(
      guestGroups([
        { groupTag: 'Colegas' },
        { groupTag: null },
        { groupTag: 'Amigos' },
        { groupTag: 'Colegas' },
      ]),
    ).toEqual(['Amigos', 'Colegas']);
  });

  it('sorts names the Portuguese way', () => {
    const names = ['Óscar', 'ana', 'Álvaro', 'Bruno'].map((displayName) => ({ displayName }));
    expect(names.sort(compareGuestNames).map((item) => item.displayName)).toEqual([
      'Álvaro',
      'ana',
      'Bruno',
      'Óscar',
    ]);
  });
});
