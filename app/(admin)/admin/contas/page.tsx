import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { ListFilters } from '@/features/admin/list-filters';
import { Pagination } from '@/features/admin/pagination';
import { StatusBadge } from '@/features/admin/status-badge';
import { formatShortDate } from '@/i18n/format';
import { formatCount } from '@/i18n/plural';
import { admin } from '@/i18n/pt-AO';
import {
  ACCOUNT_STATUS_PARAMS,
  accountListQuery,
  parseAccountListFilters,
} from '@/lib/admin/filters';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { listAccounts } from '@/server/admin/queries';

const t = admin.accounts;

export const metadata: Metadata = { title: t.title };

/** Every account (couples and admins): search, filter by status, open one to manage it. */
export default async function AccountsPage({ searchParams }: PageProps<'/admin/contas'>) {
  const user = await requireAdmin();
  const filters = parseAccountListFilters(await searchParams);
  const { items, total, page, pages } = await listAccounts(filters);
  const filtered = filters.query !== '' || filters.status !== null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <Link href="/admin/contas/nova" className={buttonClasses('primary')}>
          {t.new}
        </Link>
      </div>

      <ListFilters
        action="/admin/contas"
        query={filters.query}
        searchPlaceholder={t.searchPlaceholder}
        statuses={{
          [ACCOUNT_STATUS_PARAMS.active]: t.statuses.active,
          [ACCOUNT_STATUS_PARAMS.suspended]: t.statuses.suspended,
        }}
        status={filters.status ? ACCOUNT_STATUS_PARAMS[filters.status] : null}
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
            {items.map((account) => (
              <li
                key={account.id}
                className={`${cardClasses} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-stone-900">{account.name}</h2>
                    <StatusBadge tone={account.role === 'admin' ? 'dark' : 'neutral'}>
                      {t.roles[account.role]}
                    </StatusBadge>
                    {account.suspended ? <StatusBadge tone="bad">{t.suspended}</StatusBadge> : null}
                    {account.id === user.id ? <StatusBadge>{admin.common.you}</StatusBadge> : null}
                  </div>
                  <p className="text-sm break-all text-stone-600">{account.email}</p>
                  <p className="text-sm text-stone-600">
                    {formatCount(account.eventCount, t.events)} ·{' '}
                    {fillTemplate(t.created, { date: formatShortDate(account.createdAt) })}
                  </p>
                </div>
                <Link
                  href={`/admin/contas/${account.id}`}
                  className={buttonClasses('secondary', 'md', 'shrink-0 self-start sm:self-center')}
                  aria-label={fillTemplate(t.manageLabel, { name: account.name })}
                >
                  {t.manage}
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            pages={pages}
            hrefFor={(target) => `/admin/contas${accountListQuery({ ...filters, page: target })}`}
          />
        </>
      )}
    </main>
  );
}
