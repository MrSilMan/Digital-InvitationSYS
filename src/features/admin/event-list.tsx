import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

import { StatusBadge } from '@/components/dashboard/status-badge';
import { ThemeSwatch } from '@/components/dashboard/theme-swatch';
import { formatShortDate } from '@/i18n/format';
import { admin, dashboard } from '@/i18n/pt-AO';
import { formatRelativeDay, isSoon } from '@/i18n/relative';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import type { AdminEventRow } from '@/server/admin/queries';
import { getTheme } from '@/themes';

import { UsageMeter } from './usage-meter';

const t = admin.events;

/** The columns from `xl`; below it every row stacks into a short card. */
const COLUMNS =
  'xl:grid xl:grid-cols-[minmax(0,2.3fr)_minmax(0,1.25fr)_minmax(0,1.9fr)_minmax(0,1.15fr)_minmax(0,1fr)_1rem] xl:items-center xl:gap-x-6';

/** Below `xl`, the lines after the couple's names start under the names, not the swatch. */
const INDENT = 'pl-10 xl:pl-0';

/** Column titles (wide screens). Each cell says what it is, so they are not read out. */
export function EventListHeader() {
  const c = t.columns;
  return (
    <div
      aria-hidden="true"
      className={cn(
        COLUMNS,
        'hidden border-b border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-medium tracking-wide text-stone-600 uppercase',
      )}
    >
      <span>{c.couple}</span>
      <span>{c.date}</span>
      <span>{c.account}</span>
      <span>{c.guests}</span>
      <span>{c.status}</span>
      <span />
    </div>
  );
}

function EventStatus({ event }: { event: AdminEventRow }) {
  return (
    <StatusBadge tone={event.isActive ? 'good' : 'bad'} dot>
      {event.isActive ? t.active : t.inactive}
    </StatusBadge>
  );
}

/**
 * Events as rows: the whole row opens the event (one link per row, stretched over it, named
 * "Gerir o evento de …" for screen readers).
 */
export function EventList({ events, now }: { events: AdminEventRow[]; now: Date }) {
  return (
    <ul className="divide-y divide-stone-100">
      {events.map((event) => {
        const couple = `${event.groomName} & ${event.brideName}`;
        const soon = event.isActive && isSoon(event.startsAt, now);
        return (
          <li
            key={event.id}
            className={cn(
              COLUMNS,
              'group relative flex flex-col gap-2 py-4 pr-12 pl-5 transition-colors hover:bg-stone-50 xl:pr-5',
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex shrink-0"
                title={fillTemplate(dashboard.events.theme, {
                  theme: getTheme(event.themeId).name,
                })}
              >
                <ThemeSwatch themeId={event.themeId} size="md" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    href={`/admin/eventos/${event.id}`}
                    aria-label={fillTemplate(t.manageLabel, { couple })}
                    className="min-w-0 font-serif text-lg leading-snug wrap-break-word text-stone-900 lining-nums after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-stone-900"
                  >
                    {couple}
                  </Link>
                  <span className="flex gap-1.5 xl:hidden">
                    <EventStatus event={event} />
                  </span>
                </div>
                <p className="hidden truncate font-mono text-xs text-stone-600 sm:block">
                  /c/{event.slug}
                </p>
              </div>
            </div>

            <p
              className={cn(
                INDENT,
                'flex flex-wrap items-baseline gap-x-2 text-sm xl:flex-col xl:gap-0.5',
              )}
            >
              <span className="text-stone-900 tabular-nums">{formatShortDate(event.startsAt)}</span>
              <span aria-hidden="true" className="text-stone-400 xl:hidden">
                ·
              </span>
              <span className={soon ? 'font-medium text-amber-800' : 'text-stone-600'}>
                {formatRelativeDay(event.startsAt, now)}
              </span>
            </p>

            <div className={cn(INDENT, 'flex min-w-0 flex-col gap-0.5 text-sm')}>
              <p className="hidden truncate text-stone-900 xl:block">{event.owner.name}</p>
              <p className="truncate text-stone-600">{event.owner.email}</p>
              {event.owner.banned ? (
                <span className="mt-0.5">
                  <StatusBadge tone="bad">{admin.event.suspendedAccount}</StatusBadge>
                </span>
              ) : null}
            </div>

            <div
              className={cn(
                INDENT,
                'flex items-center gap-3 text-sm xl:flex-col xl:items-stretch xl:gap-1.5',
              )}
            >
              <span className="text-stone-900 tabular-nums">
                {fillTemplate(t.guestsShort, {
                  count: String(event._count.guests),
                  limit: String(event.guestLimit),
                })}
                <span className="xl:hidden"> {t.columns.guests.toLocaleLowerCase('pt-AO')}</span>
              </span>
              <UsageMeter
                value={event._count.guests}
                max={event.guestLimit}
                className="w-20 xl:w-full"
              />
            </div>

            <div className="hidden flex-col items-start gap-1 xl:flex">
              <EventStatus event={event} />
              <span className="text-xs whitespace-nowrap text-stone-600">
                {dashboard.events.phase[event.phase]}
              </span>
            </div>

            <IconChevronRight
              size={18}
              stroke={2}
              aria-hidden="true"
              className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-400 transition-colors group-hover:text-stone-700 xl:static xl:translate-y-0"
            />
          </li>
        );
      })}
    </ul>
  );
}
