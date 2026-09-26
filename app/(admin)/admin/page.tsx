import { IconInbox, IconPlus, IconSearch } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState, PageHeader, PageMain } from '@/components/dashboard/page-parts';
import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { EventList, EventListHeader } from '@/features/admin/event-list';
import { ListFilters, ListSummary } from '@/features/admin/list-filters';
import { Notice } from '@/features/admin/notice';
import { OverviewStats } from '@/features/admin/overview-stats';
import { Pagination } from '@/features/admin/pagination';
import { admin } from '@/i18n/pt-AO';
import {
  EVENT_STATUS_PARAMS,
  type EventStatusFilter,
  eventListQuery,
  parseEventListFilters,
} from '@/lib/admin/filters';
import { serverNow } from '@/lib/clock';
import { cn } from '@/lib/cn';
import { requireAdmin } from '@/server/admin/access';
import { countAdminEvents, listAdminEvents, loadAdminOverview } from '@/server/admin/queries';

const t = admin.events;

export const metadata: Metadata = { title: t.title };

const STATUS_TABS: (EventStatusFilter | null)[] = [null, 'active', 'inactive'];

/**
 * Every event on the platform: the overview, then search, status tabs, and one row per event.
 * `?eliminado=1`: an event was just deleted (its page sends the admin back here).
 */
export default async function AdminEventsPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseEventListFilters(params);
  const deleted = params.eliminado === '1';
  const now = serverNow();
  const [{ items, total, page, pages }, counts, overview] = await Promise.all([
    listAdminEvents(filters),
    countAdminEvents(filters.query),
    loadAdminOverview(now),
  ]);
  const filtered = filters.query !== '' || filters.status !== null;

  return (
    <PageMain>
      <PageHeader
        title={t.title}
        description={t.intro}
        actions={
          <Link href="/admin/eventos/novo" className={buttonClasses('primary')}>
            <IconPlus size={18} stroke={2} aria-hidden="true" />
            {t.new}
          </Link>
        }
      />

      {deleted ? <Notice notice={{ tone: 'success', text: t.deleted }} /> : null}

      <OverviewStats overview={overview} />

      <div className={cn(cardClasses, 'overflow-hidden')}>
        <ListFilters
          action="/admin"
          query={filters.query}
          searchPlaceholder={t.searchPlaceholder}
          tabs={STATUS_TABS.map((status) => ({
            label: status ? t.statuses[status] : t.statuses.all,
            count: counts[status ?? 'all'],
            href: `/admin${eventListQuery({ query: filters.query, status })}`,
            current: filters.status === status,
          }))}
          status={filters.status ? EVENT_STATUS_PARAMS[filters.status] : null}
        />
        {items.length === 0 ? (
          <EmptyState
            icon={
              filtered ? (
                <IconSearch size={24} stroke={1.5} aria-hidden="true" />
              ) : (
                <IconInbox size={24} stroke={1.5} aria-hidden="true" />
              )
            }
          >
            {filtered ? admin.common.noResults : t.empty}
          </EmptyState>
        ) : (
          <>
            <ListSummary total={total} forms={t.count} clearHref={filtered ? '/admin' : null} />
            <EventListHeader />
            <EventList events={items} now={now} />
            <Pagination
              page={page}
              pages={pages}
              hrefFor={(target) => `/admin${eventListQuery({ ...filters, page: target })}`}
            />
          </>
        )}
      </div>
    </PageMain>
  );
}
