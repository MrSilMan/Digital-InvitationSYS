/**
 * Date and time formatting for Portuguese (Angola). Every date is stored in UTC and always shown in
 * Luanda time (UTC+1, no daylight saving), whatever the server's or the phone's time zone.
 * Runtime-agnostic (Intl only), so it works in Server Components, the browser and `next/og`.
 */

export const TIME_ZONE = 'Africa/Luanda';
export const LOCALE = 'pt-AO';

type Part = 'day' | 'month' | 'year' | 'weekday' | 'hour' | 'minute';

function partsOf(date: Date, options: Intl.DateTimeFormatOptions): Partial<Record<Part, string>> {
  const result: Partial<Record<Part, string>> = {};
  for (const { type, value } of new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    ...options,
  }).formatToParts(date)) {
    if (type !== 'literal') result[type as Part] = value;
  }
  return result;
}

const upper = (text: string) => text.toLocaleUpperCase(LOCALE);

export interface DateParts {
  /** "15" */
  day: string;
  /** "janeiro" */
  month: string;
  /** "2027" */
  year: string;
  /** "sexta-feira" */
  weekday: string;
}

export function dateParts(date: Date): DateParts {
  const {
    day = '',
    month = '',
    year = '',
    weekday = '',
  } = partsOf(date, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  return { day, month, year, weekday };
}

/** "16h00" */
export function formatTime(date: Date): string {
  const { hour = '00', minute = '00' } = partsOf(date, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${hour}h${minute}`;
}

/** "15 • JANEIRO • 2027" (the invitation date line). */
export function formatInvitationDate(date: Date): string {
  const { day, month, year } = dateParts(date);
  return `${day} • ${upper(month)} • ${year}`;
}

/** "SEXTA-FEIRA, ÀS 16H00" (the line under the date). */
export function formatInvitationWeekdayTime(date: Date): string {
  return upper(`${dateParts(date).weekday}, às ${formatTime(date)}`);
}

/** "sexta-feira, 15 de janeiro de 2027" */
export function formatLongDate(date: Date): string {
  const { day, month, year, weekday } = dateParts(date);
  return `${weekday}, ${day} de ${month} de ${year}`;
}

/** ISO 8601 with the Luanda offset, for `<time dateTime>`: "2027-01-15T16:00+01:00". */
export function toLuandaIso(date: Date): string {
  const {
    year = '',
    hour = '00',
    minute = '00',
  } = partsOf(date, {
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const { month = '', day = '' } = partsOf(date, { month: '2-digit', day: '2-digit' });
  return `${year}-${month}-${day}T${hour}:${minute}+01:00`;
}
