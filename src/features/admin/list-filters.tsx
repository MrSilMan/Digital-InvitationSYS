import Link from 'next/link';

import { buttonClasses, cardClasses, inputClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { QUERY_MAX_LENGTH } from '@/lib/admin/filters';
import { cn } from '@/lib/cn';

const t = admin.common;

interface ListFiltersProps {
  /** The list's own path (the form submits to it). */
  action: string;
  query: string;
  searchPlaceholder: string;
  /** The `estado` values and their labels, e.g. { ativos: 'Ativos' }. */
  statuses: Record<string, string>;
  status: string | null;
}

/**
 * Search and status filter of an admin list: a plain GET form, so the filters live in the URL and
 * work without JavaScript. Submitting starts again from the first page.
 */
export function ListFilters({
  action,
  query,
  searchPlaceholder,
  statuses,
  status,
}: ListFiltersProps) {
  const filtered = query !== '' || status !== null;
  return (
    <form
      method="get"
      action={action}
      role="search"
      className={cn(cardClasses, 'flex flex-col gap-3 p-4 sm:flex-row sm:items-end')}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="filtro-q" className="text-sm font-medium text-stone-800">
          {t.search}
        </label>
        <input
          id="filtro-q"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={QUERY_MAX_LENGTH}
          placeholder={searchPlaceholder}
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-estado" className="text-sm font-medium text-stone-800">
          {t.status}
        </label>
        <select
          id="filtro-estado"
          name="estado"
          defaultValue={status ?? ''}
          className={cn(inputClasses, 'sm:w-44')}
        >
          <option value="">{t.all}</option>
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses('primary', 'md', 'flex-1 sm:flex-none')}>
          {t.filter}
        </button>
        {filtered ? (
          <Link href={action} className={buttonClasses('ghost', 'md')}>
            {t.clear}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
