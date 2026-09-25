import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses, cardClasses, inputClasses } from '@/components/dashboard/styles';
import { AuditList } from '@/features/admin/audit-list';
import { Pagination } from '@/features/admin/pagination';
import { admin } from '@/i18n/pt-AO';
import { auditQuery, parseAuditFilters } from '@/lib/admin/filters';
import { ADMIN_AREA_ACTIONS, DASHBOARD_ACTIONS } from '@/lib/audit/actions';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { listAuditEntries } from '@/server/audit/queries';

const t = admin.audit;

export const metadata: Metadata = { title: t.title };

/** The audit log: every admin change, newest first, by action and/or event/account. */
export default async function AuditLogPage({ searchParams }: PageProps<'/admin/registo'>) {
  await requireAdmin();
  const filters = parseAuditFilters(await searchParams);
  const { items, total, page, pages } = await listAuditEntries(filters);
  const targetName = filters.target
    ? (items.find((entry) => entry.target.id === filters.target?.id)?.target.name ??
      t.targets[filters.target.type])
    : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-stone-600">{t.intro}</p>
      </div>

      <form
        method="get"
        action="/admin/registo"
        className={cn(cardClasses, 'flex flex-col gap-3 p-4 sm:flex-row sm:items-end')}
      >
        {filters.target ? (
          <input
            type="hidden"
            name={filters.target.type === 'event' ? 'evento' : 'conta'}
            value={filters.target.id}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="filtro-acao" className="text-sm font-medium text-stone-800">
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
        </div>
        <button type="submit" className={buttonClasses('primary')}>
          {admin.common.filter}
        </button>
      </form>

      {filters.target ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-700">
          {fillTemplate(t.filteredBy, { target: targetName ?? '' })}
          <Link
            href={`/admin/registo${auditQuery({ action: filters.action })}`}
            className="font-medium underline underline-offset-2"
          >
            {t.showAll}
          </Link>
        </p>
      ) : null}

      <p className="text-sm text-stone-600" aria-live="polite">
        {fillTemplate(admin.common.results, { count: String(total) })}
      </p>
      <AuditList entries={items} />
      <Pagination
        page={page}
        pages={pages}
        hrefFor={(target) => `/admin/registo${auditQuery({ ...filters, page: target })}`}
      />
    </main>
  );
}
