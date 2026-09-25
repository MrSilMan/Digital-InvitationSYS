import 'server-only';

import type { GuestListItem } from '@/features/dashboard/guests/types';
import { formatShortDateTime } from '@/i18n/format';
import { guests } from '@/i18n/pt-AO';
import { confirmedPeople, guestStatus } from '@/lib/guests/status';
import { isAngolanPhone } from '@/lib/validation/phone';

import { writeCsv } from './csv';

/**
 * The guest list as CSV, for Excel with Portuguese settings: ";" between columns, UTF-8 with a
 * byte order mark (accents), CRLF line ends. The first four columns are the import's columns
 * (nome, telefone, lugares, grupo), so an export can be edited and imported again.
 *
 * Guests write some of these cells (messages, companions): any text starting like a formula
 * (= + - @, tab, carriage return) gets a leading apostrophe so spreadsheets show it instead of
 * running it (`writeCsv`; Papa Parse's own pattern misses values with line breaks).
 */

const c = guests.export.columns;
const a = guests.answer;

/**
 * Phones as text a spreadsheet keeps: Angolan numbers as people write them ("923 456 789"), others
 * with the 00 prefix ("00 351912345678"). A leading "+" would read as a formula or a number.
 */
export function spreadsheetPhone(e164: string): string {
  if (isAngolanPhone(e164)) {
    const digits = e164.slice(4);
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `00 ${e164.slice(1)}`;
}

const when = (iso: string | null) => (iso ? formatShortDateTime(new Date(iso)) : '');

export function guestsToCsv(list: readonly GuestListItem[]): string {
  const fields = [
    c.name,
    c.phone,
    c.seats,
    c.group,
    c.link,
    c.status,
    c.people,
    c.companions,
    c.message,
    c.answeredVia,
    c.answeredAt,
    c.sentAt,
    c.views,
    c.lastOpenedAt,
  ];
  const data = list.map((guest): (string | number)[] => {
    const status = guestStatus(guest);
    const answered = guest.rsvp !== null && guest.rsvp.attending !== null;
    return [
      guest.displayName,
      guest.phone ? spreadsheetPhone(guest.phone) : '',
      guest.seatsAllowed,
      guest.groupTag ?? '',
      guest.link,
      guests.status[status],
      status === 'confirmed' ? confirmedPeople(guest) : '',
      guest.rsvp?.companionNames.join(', ') ?? '',
      guest.rsvp?.message ?? '',
      answered && guest.rsvp ? a.source[guest.rsvp.source] : '',
      answered && guest.rsvp ? when(guest.rsvp.updatedAt) : '',
      when(guest.sentAt),
      guest.viewCount,
      when(guest.lastOpenedAt),
    ];
  });
  return writeCsv(fields, data);
}
