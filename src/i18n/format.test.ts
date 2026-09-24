import { describe, expect, it } from 'vitest';

import {
  dateParts,
  formatInvitationDate,
  formatInvitationWeekdayTime,
  formatLongDate,
  formatTime,
  toLuandaIso,
} from '@/i18n/format';

// Friday 15 January 2027, 16:00 in Luanda (UTC+1).
const ceremony = new Date('2027-01-15T15:00:00Z');

describe('pt-AO date formatting in Luanda time', () => {
  it('formats the invitation date line and weekday/time line like the reference', () => {
    expect(formatInvitationDate(ceremony)).toBe('15 • JANEIRO • 2027');
    expect(formatInvitationWeekdayTime(ceremony)).toBe('SEXTA-FEIRA, ÀS 16H00');
    expect(formatInvitationWeekdayTime(new Date('2026-01-16T15:30:00Z'))).toBe(
      'SEXTA-FEIRA, ÀS 16H30',
    );
  });

  it('formats times as "16h00", zero-padded, 24-hour', () => {
    expect(formatTime(ceremony)).toBe('16h00');
    expect(formatTime(new Date('2027-01-15T08:05:00Z'))).toBe('09h05');
    expect(formatTime(new Date('2027-01-15T22:30:00Z'))).toBe('23h30');
  });

  it('uses Luanda time, not UTC: late-evening UTC is already the next day', () => {
    const lateUtc = new Date('2027-01-15T23:30:00Z');
    expect(formatTime(lateUtc)).toBe('00h30');
    expect(dateParts(lateUtc)).toEqual({
      day: '16',
      month: 'janeiro',
      year: '2027',
      weekday: 'sábado',
    });
    expect(formatInvitationDate(new Date('2026-12-31T23:15:00Z'))).toBe('1 • JANEIRO • 2027');
  });

  it('names every month and weekday in Portuguese', () => {
    const months = Array.from(
      { length: 12 },
      (_, month) => dateParts(new Date(Date.UTC(2027, month, 10, 12))).month,
    );
    expect(months).toEqual([
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]);
    const weekdays = Array.from(
      { length: 7 },
      (_, offset) => dateParts(new Date(Date.UTC(2027, 0, 11 + offset, 12))).weekday,
    );
    expect(weekdays).toEqual([
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
      'domingo',
    ]);
  });

  it('formats long dates and ISO strings with the Luanda offset', () => {
    expect(formatLongDate(ceremony)).toBe('sexta-feira, 15 de janeiro de 2027');
    expect(toLuandaIso(ceremony)).toBe('2027-01-15T16:00+01:00');
    expect(toLuandaIso(new Date('2027-01-15T23:30:00Z'))).toBe('2027-01-16T00:30+01:00');
  });
});
