import { describe, expect, it } from 'vitest';

import {
  buildIcs,
  calendarEventFor,
  googleCalendarUrl,
  type CalendarEvent,
} from '@/features/invitation/calendar';
import { invitationEventFixture } from '@/features/invitation/test-fixtures';

const now = new Date('2026-09-24T10:00:00Z');

/** Unfolds RFC 5545 continuation lines. */
const unfold = (ics: string) => ics.replace(/\r\n /g, '');

describe('calendar event of an invitation', () => {
  it('covers the ceremony in UTC, with every venue in the description', () => {
    const event = calendarEventFor(invitationEventFixture());
    expect(event.title).toBe('Casamento de Braúlio e Nanda');
    expect(event.startsAt.toISOString()).toBe('2027-01-15T15:00:00.000Z');
    expect(event.endsAt.toISOString()).toBe('2027-01-16T00:00:00.000Z');
    expect(event.description).toBe(
      "As cerimónias: Praia do Bispo, 16h00\nCopo-d'água: Salão de Festas Jardim das Rosas, 20h00",
    );
    // The address already names the venue: not repeated.
    expect(event.location).toBe('Praia do Bispo, Luanda');
  });

  it('lasts six hours when the couple set no end', () => {
    const event = calendarEventFor(invitationEventFixture({ endsAt: null }));
    expect(event.endsAt.getTime() - event.startsAt.getTime()).toBe(6 * 3_600_000);
  });
});

describe('.ics file', () => {
  const event: CalendarEvent = {
    uid: 'abc@convites-digitais',
    title: 'Casamento de Braúlio e Nanda',
    description: 'Linha 1, com vírgula; e ponto e vírgula\nLinha 2 \\ barra',
    location: 'Praia do Bispo, Luanda',
    startsAt: new Date('2027-01-15T15:00:00Z'),
    endsAt: new Date('2027-01-16T00:00:00Z'),
  };
  const ics = buildIcs(event, now);

  it('is a valid VCALENDAR with CRLF line endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('writes UTC times and escapes text', () => {
    const text = unfold(ics);
    expect(text).toContain('DTSTART:20270115T150000Z');
    expect(text).toContain('DTEND:20270116T000000Z');
    expect(text).toContain('DTSTAMP:20260924T100000Z');
    expect(text).toContain(
      'DESCRIPTION:Linha 1\\, com vírgula\\; e ponto e vírgula\\nLinha 2 \\\\ barra',
    );
    expect(text).toContain('LOCATION:Praia do Bispo\\, Luanda');
    expect(text).toContain('TRIGGER:-P1D');
  });

  it('folds lines at 75 octets without splitting a character', () => {
    const long = buildIcs({ ...event, description: 'ção '.repeat(60) }, now);
    for (const line of long.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(unfold(long)).toContain(`DESCRIPTION:${'ção '.repeat(60)}`);
  });
});

describe('Google Calendar link', () => {
  it('opens a pre-filled event in Luanda time', () => {
    const url = new URL(googleCalendarUrl(calendarEventFor(invitationEventFixture())));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Casamento de Braúlio e Nanda');
    expect(url.searchParams.get('dates')).toBe('20270115T150000Z/20270116T000000Z');
    expect(url.searchParams.get('ctz')).toBe('Africa/Luanda');
    expect(url.searchParams.get('location')).toBe('Praia do Bispo, Luanda');
  });
});
