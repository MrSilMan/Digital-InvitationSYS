import { describe, expect, it } from 'vitest';

import {
  addDays,
  isDateInput,
  isTimeInput,
  luandaDateTime,
  onWeddingDay,
  toLuandaDateInput,
  toLuandaTimeInput,
} from './luanda-time';

describe('Luanda date and time inputs', () => {
  it('turns Luanda wall-clock time into UTC and back', () => {
    const instant = luandaDateTime('2027-01-15', '16:00');
    expect(instant.toISOString()).toBe('2027-01-15T15:00:00.000Z');
    expect(toLuandaDateInput(instant)).toBe('2027-01-15');
    expect(toLuandaTimeInput(instant)).toBe('16:00');
  });

  it('keeps the Luanda date for times just after midnight in Luanda (still the day before in UTC)', () => {
    const instant = new Date('2027-01-15T23:30:00Z'); // 00:30 on the 16th in Luanda
    expect(toLuandaDateInput(instant)).toBe('2027-01-16');
    expect(toLuandaTimeInput(instant)).toBe('00:30');
  });

  it('puts early-morning times on the night after the wedding day', () => {
    expect(onWeddingDay('2027-01-15', '23:30').toISOString()).toBe('2027-01-15T22:30:00.000Z');
    expect(onWeddingDay('2027-01-15', '01:00').toISOString()).toBe('2027-01-16T00:00:00.000Z');
    expect(onWeddingDay('2027-12-31', '02:00').toISOString()).toBe('2028-01-01T01:00:00.000Z');
  });

  it('adds days across months and years', () => {
    expect(addDays('2027-01-31', 1)).toBe('2027-02-01');
    expect(addDays('2027-12-31', 1)).toBe('2028-01-01');
  });

  it('accepts only real dates and 24-hour times', () => {
    expect(isDateInput('2027-01-15')).toBe(true);
    expect(isDateInput('2028-02-29')).toBe(true);
    expect(isDateInput('2027-02-29')).toBe(false);
    expect(isDateInput('15/01/2027')).toBe(false);
    expect(isTimeInput('16:00')).toBe(true);
    expect(isTimeInput('24:00')).toBe(false);
    expect(isTimeInput('9:00')).toBe(false);
  });
});
