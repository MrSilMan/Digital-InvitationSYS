'use client';

import {
  IconCalendarHeart,
  IconHistory,
  IconLayoutDashboard,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { admin, dashboard } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

const t = admin.nav;

const LINKS = [
  {
    href: '/admin',
    label: t.events,
    Icon: IconCalendarHeart,
    match: (path: string) => path === '/admin' || path.startsWith('/admin/eventos'),
  },
  {
    href: '/admin/contas',
    label: t.accounts,
    Icon: IconUsers,
    match: (path: string) => path.startsWith('/admin/contas'),
  },
  {
    href: '/admin/registo',
    label: t.audit,
    Icon: IconHistory,
    match: (path: string) => path.startsWith('/admin/registo'),
  },
];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

/**
 * The admin area's sections (the current one marked): a row under the top bar on phones, a
 * column in the sidebar from `lg`.
 */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={t.label} className="overflow-x-auto px-2 pb-2 lg:overflow-visible lg:px-3">
      <ul className="flex gap-1 lg:flex-col">
        {LINKS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors lg:py-2.5',
                  FOCUS,
                  active
                    ? 'bg-white/10 text-ivory lg:before:absolute lg:before:inset-y-2 lg:before:-left-3 lg:before:w-1 lg:before:rounded-r-full lg:before:bg-gold'
                    : 'text-mist hover:bg-white/5 hover:text-ivory',
                )}
              >
                <Icon
                  size={20}
                  stroke={1.75}
                  aria-hidden="true"
                  className={active ? 'text-gold' : undefined}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The admin's own links at the foot of the sidebar: the couples' dashboard and their account. */
export function AdminAccountNav() {
  const pathname = usePathname();
  const links = [
    { href: '/painel', label: t.dashboard, Icon: IconLayoutDashboard },
    { href: '/admin/conta', label: dashboard.links.account, Icon: IconUserCircle },
  ];
  return (
    <nav aria-label={dashboard.links.label}>
      <ul className="flex flex-col gap-0.5">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  FOCUS,
                  active ? 'bg-white/10 text-ivory' : 'text-mist hover:bg-white/5 hover:text-ivory',
                )}
              >
                <Icon
                  size={20}
                  stroke={1.75}
                  aria-hidden="true"
                  className={active ? 'text-gold' : undefined}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
