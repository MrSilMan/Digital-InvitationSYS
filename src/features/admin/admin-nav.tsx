'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { admin } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

const t = admin.nav;

const LINKS = [
  {
    href: '/admin',
    label: t.events,
    match: (path: string) => path === '/admin' || path.startsWith('/admin/eventos'),
  },
  {
    href: '/admin/contas',
    label: t.accounts,
    match: (path: string) => path.startsWith('/admin/contas'),
  },
  {
    href: '/admin/registo',
    label: t.audit,
    match: (path: string) => path.startsWith('/admin/registo'),
  },
];

/** The admin area's sections (the current one marked). */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={t.label} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1">
        {LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block border-b-2 px-3 py-2.5 font-sans text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-stone-900',
                  active
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900',
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
