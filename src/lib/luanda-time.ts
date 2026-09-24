/**
 * Date and time form inputs in Luanda time. Angola keeps UTC+1 all year (no daylight saving), so a
 * fixed offset converts exactly. The database stores UTC; couples always type Luanda times.
 * Runtime-agnostic (browser and server).
 */

const OFFSET = '+01:00';
const OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** `<input type="date">` value: 2027-01-15. */
export const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/;
/** `<input type="time">` value: 16:00. */
export const TIME_INPUT = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Times before this belong to the night after the wedding day: a reception ends at 01:00 on the
 * following date. Used for venues, timeline items and the end time.
 */
export const NEXT_DAY_BEFORE = '06:00';

/** A real calendar date (rejects 2027-02-30). */
export function isDateInput(value: string): boolean {
  if (!DATE_INPUT.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isTimeInput(value: string): boolean {
  return TIME_INPUT.test(value);
}

/** Luanda wall-clock date and time → the instant (UTC). */
export function luandaDateTime(date: string, time: string): Date {
  const instant = new Date(`${date}T${time}:00${OFFSET}`);
  if (Number.isNaN(instant.getTime()))
    throw new RangeError(`Invalid Luanda date/time: ${date} ${time}`);
  return instant;
}

/** The instant's Luanda date, for a date input. */
export function toLuandaDateInput(value: Date): string {
  return new Date(value.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** The instant's Luanda time, for a time input. */
export function toLuandaTimeInput(value: Date): string {
  return new Date(value.getTime() + OFFSET_MS).toISOString().slice(11, 16);
}

export function addDays(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** A time on the wedding day; early-morning times move to the next date (see NEXT_DAY_BEFORE). */
export function onWeddingDay(date: string, time: string): Date {
  return luandaDateTime(time < NEXT_DAY_BEFORE ? addDays(date, 1) : date, time);
}
