import { formatTime, TIME_ZONE } from '@/i18n/format';
import { invitation } from '@/i18n/pt-AO';

import { fillTemplate } from './text';
import type { InvitationEvent } from './types';

/** "Add to calendar": an .ics file (RFC 5545) and a Google Calendar link for the ceremony. */

export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: Date;
  endsAt: Date;
}

/** Used when the couple set no end time. */
const DEFAULT_DURATION_MS = 6 * 60 * 60 * 1000;

/** "Praia do Bispo, Luanda" without repeating the venue when the address already has it. */
function placeLabel(venue: string, address: string | null): string {
  if (!address) return venue;
  return address.toLocaleLowerCase('pt-AO').includes(venue.toLocaleLowerCase('pt-AO'))
    ? address
    : `${venue}, ${address}`;
}

export function calendarEventFor(event: InvitationEvent): CalendarEvent {
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt
    ? new Date(event.endsAt)
    : new Date(startsAt.getTime() + DEFAULT_DURATION_MS);
  const [first] = event.locations;
  return {
    uid: `${event.id}@convites-digitais`,
    title: fillTemplate(invitation.calendar.title, {
      groom: event.groomName,
      bride: event.brideName,
    }),
    description: event.locations
      .map((location) =>
        fillTemplate(invitation.calendar.location, {
          heading: location.heading,
          venue: location.venueName,
          time: formatTime(new Date(location.startsAt)),
        }),
      )
      .join('\n'),
    location: first ? placeLabel(first.venueName, first.address) : null,
    startsAt,
    endsAt,
  };
}

const CRLF = '\r\n';
const encoder = new TextEncoder();

/** "20270115T150000Z" */
function formatUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/** TEXT values escape backslashes, semicolons, commas and line breaks (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Lines over 75 octets continue on the next line after one space (RFC 5545 §3.1). */
function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += character;
    bytes += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

export function buildIcs(event: CalendarEvent, now: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Convites Digitais//Convite//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(event.endsAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    // A reminder the day before.
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.title)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatUtc(event.startsAt)}/${formatUtc(event.endsAt)}`,
    ctz: TIME_ZONE,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
