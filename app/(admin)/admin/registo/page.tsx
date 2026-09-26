import { IconFilter, IconX } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, PageMain } from '@/components/dashboard/page-parts';
import { buttonClasses, cardClasses, inputClasses } from '@/components/dashboard/styles';
import { AuditList } from '@/features/admin/audit-list';
import { ListSummary } from '@/features/admin/list-filters';
import { Pagination } from '@/features/admin/pagination';
import { admin } from '@/i18n/pt-AO';
import { auditQuery, parseAuditFilters } from '@/lib/admin/filters';
import { ADMIN_AREA_ACTIONS, DASHBOARD_ACTIONS } from '@/lib/audit/actions';
import { serverNow } from '@/lib/clock';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { listAuditEntries } from '@/server/audit/queries';

const t = admin.audit;

export const metadata: Metadata = { title: t.title };

/** The audit log: every admin change, newest first and by day, by action and/or event/account. */
export default async function AuditLogPage({ searchParams }: PageProps<'/admin/registo'>) {
  await requireAdmin();
  const filters = parseAuditFilters(await searchParams);
  const { items, total, page, pages } = await listAuditEntries(filters);
  const targetName = filters.target
    ? (items.find((entry) => entry.target.id === filters.target?.id)?.target.name ??
      t.targets[filters.target.type])
    : null;
  const filtered = filters.action !== null || filters.target !== null;

  return (
    <PageMain>
      <PageHeader title={t.title} description={t.intro} />

      <div className={cn(cardClasses, 'overflow-hidden')}>
        <div className="flex flex-col gap-3 border-b border-stone-200 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <form method="get" action="/admin/registo" className="flex gap-2 lg:w-md">
            {filters.target ? (
              <input
                type="hidden"
                name={filters.target.type === 'event' ? 'evento' : 'conta'}
                value={filters.target.id}
              />
            ) : null}
            <label htmlFor="filtro-acao" className="sr-only">
              {t.action}
            </label>
            <select
              id="filtro-acao"
              name="acao"
              defaultValue={filters.action ?? ''}
              className={inputClasses}
            >
              <option value="">{t.allActions}</option>
              <optgroup label={t.groups.adminArea}>
                {ADMIN_AREA_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {t.actions[action]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.groups.dashboard}>
                {DASHBOARD_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {t.actions[action]}
                  </option>
                ))}
              </optgroup>
            </select>
            <button type="submit" className={buttonClasses('secondary')}>
              <IconFilter size={16} stroke={1.75} aria-hidden="true" />
              {admin.common.filter}
            </button>
          </form>

          {filters.target ? (
            <p className="flex items-center gap-2 self-start rounded-full bg-stone-100 py-1 pr-1 pl-3 text-sm text-stone-800 lg:self-auto">
              {fillTemplate(t.filteredBy, { target: targetName ?? '' })}
              <Link
                href={`/admin/registo${auditQuery({ action: filters.action })}`}
                className="inline-flex size-7 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
                aria-label={t.showAll}
                title={t.showAll}
              >
                <IconX size={16} stroke={2} aria-hidden="true" />
              </Link>
            </p>
          ) : null}
        </div>

        <ListSummary total={total} forms={t.count} clearHref={filtered ? '/admin/registo' : null} />
        <AuditList entries={items} now={serverNow()} />
        <Pagination
          page={page}
          pages={pages}
          hrefFor={(target) => `/admin/registo${auditQuery({ ...filters, page: target })}`}
        />
      </div>
    </PageMain>
  );
}
