import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { ListFilters } from '@/features/admin/list-filters';
import { Pagination } from '@/features/admin/pagination';
import { StatusBadge } from '@/features/admin/status-badge';
import { formatLongDate } from '@/i18n/format';
import { admin, dashboard } from '@/i18n/pt-AO';
import { EVENT_STATUS_PARAMS, eventListQuery, parseEventListFilters } from '@/lib/admin/filters';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { listAdminEvents } from '@/server/admin/queries';
import { getTheme } from '@/themes';

const t = admin.events;

export const metadata: Metadata = { title: t.title };

/** Every event on the platform: search, filter by status, and open one to manage it. */
export default async function AdminEventsPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin();
  const filters = parseEventListFilters(await searchParams);
  const { items, total, page, pages } = await listAdminEvents(filters);
  const filtered = filters.query !== '' || filters.status !== null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <Link href="/admin/eventos/novo" className={buttonClasses('primary')}>
          {t.new}
        </Link>
      </div>

      <ListFilters
        action="/admin"
        query={filters.query}
        searchPlaceholder={t.searchPlaceholder}
        statuses={{
          [EVENT_STATUS_PARAMS.active]: t.statuses.active,
          [EVENT_STATUS_PARAMS.inactive]: t.statuses.inactive,
        }}
        status={filters.status ? EVENT_STATUS_PARAMS[filters.status] : null}
      />

      {items.length === 0 ? (
        <p className={`${cardClasses} p-6 text-stone-600`}>
          {filtered ? admin.common.noResults : t.empty}
        </p>
      ) : (
        <>
          <p className="text-sm text-stone-600" aria-live="polite">
            {fillTemplate(admin.common.results, { count: String(total) })}
          </p>
          <ul className="flex flex-col gap-3">
            {items.map((event) => {
              const couple = `${event.groomName} & ${event.brideName}`;
              return (
                <li
                  key={event.id}
                  className={`${cardClasses} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl text-stone-900">{couple}</h2>
                      <StatusBadge tone={event.isActive ? 'good' : 'bad'}>
                        {event.isActive ? t.active : t.inactive}
                      </StatusBadge>
                      <StatusBadge>{dashboard.events.phase[event.phase]}</StatusBadge>
                    </div>
                    <p className="text-sm text-stone-600">
                      {formatLongDate(event.startsAt)} ·{' '}
                      {fillTemplate(dashboard.events.theme, {
                        theme: getTheme(event.themeId).name,
                      })}
                    </p>
                    <p className="truncate text-sm text-stone-600">
                      {event.owner.name} · {event.owner.email}
                    </p>
                    <p className="text-sm text-stone-600 tabular-nums">
                      {fillTemplate(t.guests, {
                        count: String(event._count.guests),
                        limit: String(event.guestLimit),
                      })}{' '}
                      · /c/{event.slug}
                    </p>
                  </div>
                  <Link
                    href={`/admin/eventos/${event.id}`}
                    className={buttonClasses(
                      'secondary',
                      'md',
                      'shrink-0 self-start sm:self-center',
                    )}
                    aria-label={fillTemplate(t.manageLabel, { couple })}
                  >
                    {t.manage}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination
            page={page}
            pages={pages}
            hrefFor={(target) => `/admin${eventListQuery({ ...filters, page: target })}`}
          />
        </>
      )}
    </main>
  );
}
