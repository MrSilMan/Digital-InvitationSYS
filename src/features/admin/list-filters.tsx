import { IconSearch } from '@tabler/icons-react';
import Link from 'next/link';

import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { formatCount } from '@/i18n/plural';
import { QUERY_MAX_LENGTH } from '@/lib/admin/filters';
import { cn } from '@/lib/cn';

const t = admin.common;

export interface StatusTab {
  label: string;
  count: number;
  /** The list in this status, keeping the search. */
  href: string;
  current: boolean;
}

interface ListFiltersProps {
  /** The list's own path (the search submits to it). */
  action: string;
  query: string;
  searchPlaceholder: string;
  tabs: StatusTab[];
  /** The current `estado` value, kept when searching. */
  status: string | null;
}

/**
 * The top of an admin list: status tabs with their counts, and the search. Plain links and a GET
 * form, so the filters live in the URL and work without JavaScript. Both start again from the
 * first page.
 */
export function ListFilters({ action, query, searchPlaceholder, tabs, status }: ListFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-stone-200 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label={t.statusFilter} className="-mx-1 overflow-x-auto px-1">
        <ul className="inline-flex gap-1 rounded-lg bg-stone-100 p-1">
          {tabs.map((tab) => (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={tab.current ? 'page' : undefined}
                className={cn(
                  'flex min-h-8 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-stone-900',
                  tab.current
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    tab.current ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700',
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form method="get" action={action} role="search" className="flex gap-2 lg:w-md">
        {status ? <input type="hidden" name="estado" value={status} /> : null}
        <label htmlFor="filtro-q" className="sr-only">
          {t.search}
        </label>
        <div className="relative min-w-0 flex-1">
          <IconSearch
            size={18}
            stroke={1.75}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-500"
            aria-hidden="true"
          />
          <input
            id="filtro-q"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={QUERY_MAX_LENGTH}
            placeholder={searchPlaceholder}
            className={cn(inputClasses, 'h-full pl-9')}
          />
        </div>
        <button type="submit" className={buttonClasses('secondary')}>
          {t.search}
        </button>
      </form>
    </div>
  );
}

/** "31 eventos", and a way back to the whole list when filtered. */
export function ListSummary({
  total,
  forms,
  clearHref,
}: {
  total: number;
  forms: { one: string; other: string };
  /** Shown when the list is filtered. */
  clearHref: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-5 py-3 text-sm text-stone-600">
      <p aria-live="polite" className="tabular-nums">
        {formatCount(total, forms)}
      </p>
      {clearHref ? (
        <Link
          href={clearHref}
          className="font-medium text-stone-800 underline underline-offset-4 hover:text-stone-950"
        >
          {t.clear}
        </Link>
      ) : null}
    </div>
  );
}
