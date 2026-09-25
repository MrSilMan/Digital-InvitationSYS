'use client';

import { IconSearch } from '@tabler/icons-react';
import { useId } from 'react';

import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { guests } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { type GuestFilters, type InviteFilter, NO_FILTERS } from '@/lib/guests/filters';
import type { AnswerStatus } from '@/lib/guests/status';
import { fillTemplate } from '@/lib/template';

const t = guests.filters;

const ANSWERS = Object.keys(t.answers) as AnswerStatus[];
const INVITES = Object.keys(t.invites) as InviteFilter[];

/** Search, answer, invitation and group filters, with how many guests they leave. */
export function GuestFiltersBar({
  filters,
  groups,
  shown,
  total,
  onChange,
}: {
  filters: GuestFilters;
  groups: string[];
  shown: number;
  total: number;
  onChange: (filters: GuestFilters) => void;
}) {
  const id = useId();
  const set = (change: Partial<GuestFilters>) => onChange({ ...filters, ...change });
  const active =
    filters.answer !== null ||
    filters.invite !== null ||
    filters.group !== null ||
    filters.query.trim() !== '';

  return (
    <search aria-label={t.label} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-1">
          <label htmlFor={`${id}-q`} className="text-sm font-medium text-stone-800">
            {t.search}
          </label>
          <div className="relative">
            <IconSearch
              size={18}
              stroke={1.75}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id={`${id}-q`}
              type="search"
              value={filters.query}
              placeholder={t.searchPlaceholder}
              autoComplete="off"
              onChange={(event) => set({ query: event.target.value })}
              className={cn(inputClasses, 'pl-9')}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-answer`} className="text-sm font-medium text-stone-800">
            {t.answer}
          </label>
          <select
            id={`${id}-answer`}
            value={filters.answer ?? ''}
            onChange={(event) =>
              set({ answer: (event.target.value || null) as AnswerStatus | null })
            }
            className={inputClasses}
          >
            <option value="">{t.all}</option>
            {ANSWERS.map((answer) => (
              <option key={answer} value={answer}>
                {t.answers[answer]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-invite`} className="text-sm font-medium text-stone-800">
            {t.invite}
          </label>
          <select
            id={`${id}-invite`}
            value={filters.invite ?? ''}
            onChange={(event) =>
              set({ invite: (event.target.value || null) as InviteFilter | null })
            }
            className={inputClasses}
          >
            <option value="">{t.all}</option>
            {INVITES.map((invite) => (
              <option key={invite} value={invite}>
                {t.invites[invite]}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <label htmlFor={`${id}-group`} className="text-sm font-medium text-stone-800">
            {t.group}
          </label>
          <select
            id={`${id}-group`}
            value={filters.group ?? ''}
            onChange={(event) => set({ group: event.target.value || null })}
            className={inputClasses}
          >
            <option value="">{t.all}</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
            {/* A group from the URL that no guest has any more stays selectable. */}
            {filters.group && !groups.includes(filters.group) ? (
              <option value={filters.group}>{filters.group}</option>
            ) : null}
          </select>
        </div>
      </div>
      <div className="flex min-h-9 flex-wrap items-center gap-3">
        <p className="text-sm text-stone-600" aria-live="polite">
          {fillTemplate(t.showing, { count: String(shown), total: String(total) })}
        </p>
        {active ? (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className={buttonClasses('ghost', 'sm')}
          >
            {t.clear}
          </button>
        ) : null}
      </div>
    </search>
  );
}
