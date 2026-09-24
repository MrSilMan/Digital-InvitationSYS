import { describe, expect, it } from 'vitest';

import { compactIban, formatIban, isValidIban } from './iban';

describe('IBAN', () => {
  it('accepts valid IBANs however they are typed', () => {
    expect(isValidIban('AO33 0000 0000 0000 0000 0000 0')).toBe(true);
    expect(isValidIban('ao33000000000000000000000')).toBe(true);
    expect(isValidIban('PT50 0002 0123 1234 5678 9015 4')).toBe(true);
    expect(isValidIban('DE89 3704 0044 0532 0130 00')).toBe(true);
  });

  it('rejects typos, wrong lengths and other text', () => {
    expect(isValidIban('AO33 0000 0000 0000 0000 0000 1')).toBe(false);
    expect(isValidIban('AO06 0000 0000 0000 0000 0000 0')).toBe(false);
    // Angolan IBANs have exactly 25 characters.
    expect(isValidIban('AO33 0000 0000 0000 0000 0000')).toBe(false);
    expect(isValidIban('não sei')).toBe(false);
    expect(isValidIban('')).toBe(false);
  });

  it('compacts for copying and groups by four for reading', () => {
    expect(compactIban(' ao33-0000 0000 ')).toBe('AO3300000000');
    expect(formatIban('AO33000000000000000000000')).toBe('AO33 0000 0000 0000 0000 0000 0');
  });
});
