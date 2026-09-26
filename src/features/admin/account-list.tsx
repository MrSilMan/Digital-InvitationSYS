import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

import { Avatar } from '@/components/dashboard/avatar';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatShortDate } from '@/i18n/format';
import { formatCount } from '@/i18n/plural';
import { admin } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import type { AdminAccount } from '@/server/admin/queries';

const t = admin.accounts;

/** The columns from `lg`; below it every row stacks. */
const COLUMNS =
  'lg:grid lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_1rem] lg:items-center lg:gap-x-6';

/** Below `lg`, the lines after the name start under it, not under the avatar. */
const INDENT = 'pl-12 lg:pl-0';

/** Column titles (wide screens). Each cell says what it is, so they are not read out. */
export function AccountListHeader() {
  const c = t.columns;
  return (
    <div
      aria-hidden="true"
      className={cn(
        COLUMNS,
        'hidden border-b border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-medium tracking-wide text-stone-600 uppercase',
      )}
    >
      <span>{c.account}</span>
      <span>{c.role}</span>
      <span>{c.events}</span>
      <span>{c.created}</span>
      <span />
    </div>
  );
}

/** Accounts as rows; the whole row opens the account (one stretched link per row). */
export function AccountList({
  accounts,
  currentUserId,
}: {
  accounts: AdminAccount[];
  currentUserId: string;
}) {
  return (
    <ul className="divide-y divide-stone-100">
      {accounts.map((account) => (
        <li
          key={account.id}
          className={cn(
            COLUMNS,
            'group relative flex flex-col gap-2 py-4 pr-12 pl-5 transition-colors hover:bg-stone-50 lg:pr-5',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={account.name} />
            <div className="flex min-w-0 flex-col">
              <Link
                href={`/admin/contas/${account.id}`}
                aria-label={fillTemplate(t.manageLabel, { name: account.name })}
                className="truncate font-medium text-stone-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-stone-900"
              >
                {account.name}
              </Link>
              <p className="truncate text-sm text-stone-600">{account.email}</p>
            </div>
          </div>

          <div className={cn(INDENT, 'flex flex-wrap items-center gap-1.5')}>
            <StatusBadge tone={account.role === 'admin' ? 'dark' : 'neutral'}>
              {t.roles[account.role]}
            </StatusBadge>
            {account.suspended ? (
              <StatusBadge tone="bad" dot>
                {t.suspended}
              </StatusBadge>
            ) : null}
            {account.id === currentUserId ? (
              <StatusBadge tone="warn">{admin.common.you}</StatusBadge>
            ) : null}
          </div>

          <p className={cn(INDENT, 'text-sm text-stone-700 tabular-nums')}>
            {formatCount(account.eventCount, t.events)}
          </p>

          <p className={cn(INDENT, 'text-sm text-stone-600 tabular-nums')}>
            <span className="lg:hidden">
              {fillTemplate(t.created, { date: formatShortDate(account.createdAt) })}
            </span>
            <span className="hidden lg:inline">{formatShortDate(account.createdAt)}</span>
          </p>

          <IconChevronRight
            size={18}
            stroke={2}
            aria-hidden="true"
            className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-400 transition-colors group-hover:text-stone-700 lg:static lg:translate-y-0"
          />
        </li>
      ))}
    </ul>
  );
}
