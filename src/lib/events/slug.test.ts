import { describe, expect, it } from 'vitest';

import { isEventSlug } from '@/lib/validation/invitation';

import { EVENT_SLUG_MAX_LENGTH, nextFreeSlug, suggestEventSlug, toSlugPart } from './slug';

describe('suggestEventSlug', () => {
  it('joins the names without accents, in lower case', () => {
    expect(suggestEventSlug('Braúlio', 'Nanda')).toBe('braulio-e-nanda');
    expect(suggestEventSlug('João Conceição', 'Ângela')).toBe('joao-conceicao-e-angela');
  });

  it('turns anything else into single hyphens', () => {
    expect(suggestEventSlug("  D'Alva  ", 'Ana-Maria & Co.')).toBe('d-alva-e-ana-maria-co');
    expect(toSlugPart('--Zé__Manel--')).toBe('ze-manel');
  });

  it('leaves out a name without letters or digits', () => {
    expect(suggestEventSlug('Braúlio', '✿')).toBe('braulio');
    expect(suggestEventSlug('', '')).toBe('');
  });

  it('always gives a valid slug, at most 80 characters, without a trailing hyphen', () => {
    const long = suggestEventSlug('a'.repeat(50), `${'b'.repeat(26)} c`);
    expect(long.length).toBeLessThanOrEqual(EVENT_SLUG_MAX_LENGTH);
    expect(long.endsWith('-')).toBe(false);
    expect(isEventSlug(long)).toBe(true);
    expect(isEventSlug(suggestEventSlug('Braúlio', 'Nanda'))).toBe(true);
  });
});

describe('nextFreeSlug', () => {
  it('keeps a free slug, else counts up from 2', () => {
    expect(nextFreeSlug('ana-e-joao', new Set())).toBe('ana-e-joao');
    expect(nextFreeSlug('ana-e-joao', new Set(['ana-e-joao']))).toBe('ana-e-joao-2');
    expect(nextFreeSlug('ana-e-joao', new Set(['ana-e-joao', 'ana-e-joao-2']))).toBe(
      'ana-e-joao-3',
    );
  });

  it('shortens a long slug to make room for the number', () => {
    const base = 'a'.repeat(EVENT_SLUG_MAX_LENGTH);
    const next = nextFreeSlug(base, new Set([base]));
    expect(next).toHaveLength(EVENT_SLUG_MAX_LENGTH);
    expect(next.endsWith('-2')).toBe(true);
    expect(isEventSlug(next)).toBe(true);
  });
});
