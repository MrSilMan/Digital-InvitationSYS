import { describe, expect, it } from 'vitest';

import { formatCount, formatSeatsNote } from '@/i18n/plural';
import { invitation } from '@/i18n/pt-AO';

describe('Portuguese plurals', () => {
  it.each([
    [0, '0 pessoas'],
    [1, '1 pessoa'],
    [2, '2 pessoas'],
    [12, '12 pessoas'],
  ])('%i → "%s"', (count, expected) => {
    expect(formatCount(count, invitation.people)).toBe(expected);
  });

  it('fills the info box template', () => {
    expect(formatSeatsNote(1)).toBe('Convite válido para 1 pessoa');
    expect(formatSeatsNote(4)).toBe('Convite válido para 4 pessoas');
    expect(formatSeatsNote(2, 'Reservámos {seats} ({seats})')).toBe(
      'Reservámos 2 pessoas (2 pessoas)',
    );
  });
});
