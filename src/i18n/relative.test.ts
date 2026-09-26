import { describe, expect, it } from 'vitest';

import { formatRelativeDay, isSoon } from './relative';

// 10:00 in Luanda on Saturday, 26 September 2026.
const now = new Date('2026-09-26T09:00:00Z');
const at = (iso: string) => new Date(iso);

describe('formatRelativeDay', () => {
  it('names the nearest days', () => {
    expect(formatRelativeDay(at('2026-09-26T21:00:00Z'), now)).toBe('hoje');
    // 00:30 on the 27th in Luanda, still the 26th in UTC.
    expect(formatRelativeDay(at('2026-09-26T23:30:00Z'), now)).toBe('amanhã');
    expect(formatRelativeDay(at('2026-09-25T08:00:00Z'), now)).toBe('ontem');
  });

  it('counts days, then months, then years', () => {
    expect(formatRelativeDay(at('2026-10-08T15:00:00Z'), now)).toBe('daqui a 12 dias');
    expect(formatRelativeDay(at('2026-09-20T15:00:00Z'), now)).toBe('há 6 dias');
    expect(formatRelativeDay(at('2026-11-15T15:00:00Z'), now)).toBe('daqui a 2 meses');
    expect(formatRelativeDay(at('2026-11-09T15:00:00Z'), now)).toBe('daqui a 44 dias');
    expect(formatRelativeDay(at('2026-11-10T15:00:00Z'), now)).toBe('daqui a 1 mês');
    expect(formatRelativeDay(at('2027-06-12T15:00:00Z'), now)).toBe('daqui a 9 meses');
    expect(formatRelativeDay(at('2025-06-01T15:00:00Z'), now)).toBe('há 16 meses');
    expect(formatRelativeDay(at('2029-01-01T15:00:00Z'), now)).toBe('daqui a 2 anos');
  });
});

describe('isSoon', () => {
  it('is today up to 30 days ahead, never the past', () => {
    expect(isSoon(at('2026-09-26T20:00:00Z'), now)).toBe(true);
    expect(isSoon(at('2026-10-26T15:00:00Z'), now)).toBe(true);
    expect(isSoon(at('2026-10-27T15:00:00Z'), now)).toBe(false);
    expect(isSoon(at('2026-09-25T15:00:00Z'), now)).toBe(false);
  });
});
