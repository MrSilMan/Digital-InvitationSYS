import { IconSearch, IconUserPlus, IconUsers } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState, PageHeader, PageMain } from '@/components/dashboard/page-parts';
import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { AccountList, AccountListHeader } from '@/features/admin/account-list';
import { ListFilters, ListSummary } from '@/features/admin/list-filters';
import { Notice } from '@/features/admin/notice';
import { Pagination } from '@/features/admin/pagination';
import { admin } from '@/i18n/pt-AO';
import {
  ACCOUNT_STATUS_PARAMS,
  type AccountStatusFilter,
  accountListQuery,
  parseAccountListFilters,
} from '@/lib/admin/filters';
import { cn } from '@/lib/cn';
import { requireAdmin } from '@/server/admin/access';
import { countAccounts, listAccounts } from '@/server/admin/queries';

const t = admin.accounts;

export const metadata: Metadata = { title: t.title };

const STATUS_TABS: (AccountStatusFilter | null)[] = [null, 'active', 'suspended'];

/**
 * Every account (couples and admins): search, status tabs, one row per account.
 * `?eliminada=1`: an account was just deleted (its page sends the admin back here).
 */
export default async function AccountsPage({ searchParams }: PageProps<'/admin/contas'>) {
  const user = await requireAdmin();
  const params = await searchParams;
  const filters = parseAccountListFilters(params);
  const deleted = params.eliminada === '1';
  const [{ items, total, page, pages }, counts] = await Promise.all([
    listAccounts(filters),
    countAccounts(filters.query),
  ]);
  const filtered = filters.query !== '' || filters.status !== null;

  return (
    <PageMain>
      <PageHeader
        title={t.title}
        description={t.intro}
        actions={
          <Link href="/admin/contas/nova" className={buttonClasses('primary')}>
            <IconUserPlus size={18} stroke={2} aria-hidden="true" />
            {t.new}
          </Link>
        }
      />

      {deleted ? <Notice notice={{ tone: 'success', text: t.deleted }} /> : null}

      <div className={cn(cardClasses, 'overflow-hidden')}>
        <ListFilters
          action="/admin/contas"
          query={filters.query}
          searchPlaceholder={t.searchPlaceholder}
          tabs={STATUS_TABS.map((status) => ({
            label: status ? t.statuses[status] : t.statuses.all,
            count: counts[status ?? 'all'],
            href: `/admin/contas${accountListQuery({ query: filters.query, status })}`,
            current: filters.status === status,
          }))}
          status={filters.status ? ACCOUNT_STATUS_PARAMS[filters.status] : null}
        />
        {items.length === 0 ? (
          <EmptyState
            icon={
              filtered ? (
                <IconSearch size={24} stroke={1.5} aria-hidden="true" />
              ) : (
                <IconUsers size={24} stroke={1.5} aria-hidden="true" />
              )
            }
          >
            {filtered ? admin.common.noResults : t.empty}
          </EmptyState>
        ) : (
          <>
            <ListSummary
              total={total}
              forms={t.count}
              clearHref={filtered ? '/admin/contas' : null}
            />
            <AccountListHeader />
            <AccountList accounts={items} currentUserId={user.id} />
            <Pagination
              page={page}
              pages={pages}
              hrefFor={(target) => `/admin/contas${accountListQuery({ ...filters, page: target })}`}
            />
          </>
        )}
      </div>
    </PageMain>
  );
}
