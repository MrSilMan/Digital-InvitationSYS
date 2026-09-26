import { IconArrowRight, IconInbox } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState, PageHeader, PageMain } from '@/components/dashboard/page-parts';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatLongDate } from '@/i18n/format';
import { formatCount } from '@/i18n/plural';
import { dashboard } from '@/i18n/pt-AO';
import { formatRelativeDay, isSoon } from '@/i18n/relative';
import { serverNow } from '@/lib/clock';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import { requireUser } from '@/server/auth/session';
import { listEditableEvents } from '@/server/events/queries';
import { getTheme } from '@/themes';

const t = dashboard.events;

export const metadata: Metadata = { title: t.title };

/** "B & N": the first letters of the couple's names. */
function initials(groomName: string, brideName: string): string {
  const first = (name: string) => name.trim().charAt(0).toLocaleUpperCase('pt-AO');
  return `${first(groomName)} & ${first(brideName)}`;
}

/**
 * The events the signed-in couple can edit (every event for an admin), as cards that show each
 * invitation's theme. The whole card opens the event.
 */
export default async function DashboardHomePage() {
  const user = await requireUser();
  const events = await listEditableEvents(user);
  const isAdmin = user.role === 'admin';
  const now = serverNow();

  return (
    <PageMain>
      <PageHeader
        title={isAdmin ? t.titleAdmin : t.title}
        description={isAdmin ? t.introAdmin : t.intro}
      />
      {events.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-xs">
          <EmptyState icon={<IconInbox size={24} stroke={1.5} aria-hidden="true" />}>
            {t.empty}
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const couple = `${event.groomName} & ${event.brideName}`;
            const theme = getTheme(event.themeId);
            const soon = event.isActive && isSoon(event.startsAt, now);
            return (
              <li
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-md"
              >
                {/* The theme's paper and colours, like a small invitation. Decorative. */}
                <div
                  aria-hidden="true"
                  className="flex h-24 items-center justify-center gap-3 border-b border-stone-200"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <span className="h-px w-8" style={{ backgroundColor: theme.colors.accent }} />
                  <span
                    className="font-serif text-3xl italic lining-nums"
                    style={{ color: theme.colors.script }}
                  >
                    {initials(event.groomName, event.brideName)}
                  </span>
                  <span className="h-px w-8" style={{ backgroundColor: theme.colors.accent }} />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge>{t.phase[event.phase]}</StatusBadge>
                    {event.isActive ? null : (
                      <StatusBadge tone="bad" dot>
                        {t.inactive}
                      </StatusBadge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-serif text-xl leading-snug wrap-break-word text-stone-900 lining-nums">
                      {couple}
                    </h2>
                    <p className="text-sm text-stone-600">
                      {formatLongDate(event.startsAt)}
                      <br />
                      <span className={cn(soon && 'font-medium text-amber-800')}>
                        {formatRelativeDay(event.startsAt, now)}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm text-stone-600">
                    {fillTemplate(t.theme, { theme: theme.name })} ·{' '}
                    {formatCount(event._count.guests, t.guestCount)}
                  </p>
                  <div className="mt-auto flex justify-end border-t border-stone-100 pt-3">
                    <Link
                      href={`/painel/eventos/${event.id}`}
                      aria-label={`${t.open}: ${couple}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-stone-900"
                    >
                      {t.open}
                      <IconArrowRight
                        size={16}
                        stroke={2}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageMain>
  );
}
