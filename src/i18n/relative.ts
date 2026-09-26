import { luandaDaysBetween } from '@/lib/luanda-time';
import { fillTemplate } from '@/lib/template';

import { formatCount } from './plural';
import { relativeDay as t } from './pt-AO';

/** Weddings this close are marked in the lists ("soon"). */
export const SOON_DAYS = 30;

function spanOf(days: number): string {
  if (days < 45) return formatCount(days, t.days);
  if (days < 548) return formatCount(Math.round(days / 30.44), t.months);
  return formatCount(Math.round(days / 365.25), t.years);
}

/**
 * How far a date is from today in Luanda calendar days, in words: "hoje", "amanhã",
 * "daqui a 12 dias", "há 3 meses", "daqui a 2 anos".
 */
export function formatRelativeDay(date: Date, now: Date): string {
  const days = luandaDaysBetween(now, date);
  if (days === 0) return t.today;
  if (days === 1) return t.tomorrow;
  if (days === -1) return t.yesterday;
  return fillTemplate(days > 0 ? t.future : t.past, { span: spanOf(Math.abs(days)) });
}

/** Today or within the next SOON_DAYS days. */
export function isSoon(date: Date, now: Date): boolean {
  const days = luandaDaysBetween(now, date);
  return days >= 0 && days <= SOON_DAYS;
}
