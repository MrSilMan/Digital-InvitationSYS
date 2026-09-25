'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

import { eventNav } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

const t = eventNav;

/** The pages of one event: overview, guests, editor (the current one marked). */
export function EventNav({ eventId }: { eventId: string }) {
  // null on the overview (the layout's own page), else the child folder's name.
  const segment = useSelectedLayoutSegment();
  const base = `/painel/eventos/${eventId}`;
  const links = [
    { href: base, label: t.overview, active: segment === null || segment.startsWith('__PAGE__') },
    { href: `${base}/convidados`, label: t.guests, active: segment === 'convidados' },
    { href: `${base}/editar`, label: t.editor, active: segment === 'editar' },
  ];
  return (
    <nav aria-label={t.label} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1">
        {links.map((link) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              className={cn(
                'block border-b-2 px-3 py-2.5 font-sans text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-stone-900',
                link.active
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900',
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
