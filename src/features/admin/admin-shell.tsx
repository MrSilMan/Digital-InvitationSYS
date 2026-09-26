import { IconLayoutDashboard, IconLogout, IconUserCircle } from '@tabler/icons-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Avatar } from '@/components/dashboard/avatar';
import { nightButtonClasses, nightFrameClasses } from '@/components/dashboard/styles';
import { Wordmark } from '@/components/dashboard/wordmark';
import { signOut } from '@/features/auth/actions';
import { admin, auth, dashboard } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

import { AdminAccountNav, AdminNav } from './admin-nav';

/** An icon with its label next to it from `md` (only the icon on phones). */
const ICON_BUTTON = cn(nightButtonClasses, 'px-2.5');

const ICON_ONLY = cn(nightButtonClasses, 'size-10 shrink-0');

interface AdminShellProps {
  user: { name: string; email: string };
  children: ReactNode;
}

/**
 * The admin area's frame: the landing page's night and gold, so the area is never mistaken for a
 * couple's dashboard. A sidebar from `lg` (sections, the admin's own links, the signed-in admin);
 * on phones a top bar with the sections underneath.
 */
export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="min-h-svh bg-stone-100 font-sans text-stone-900">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {dashboard.skipToContent}
      </a>
      <header
        className={cn(
          nightFrameClasses,
          'lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:overflow-y-auto',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 lg:px-6 lg:pt-8 lg:pb-7">
          <Link
            href="/admin"
            className="flex flex-col rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Wordmark className="text-[1.75rem] lg:text-[2rem]" />
            <span className="text-[0.6875rem] font-semibold tracking-[0.2em] text-mist uppercase">
              {admin.title}
            </span>
          </Link>
          {/* Phones and tablets: the admin's own links in the top bar (the sidebar has them below). */}
          <nav aria-label={dashboard.links.label} className="flex items-center gap-1 lg:hidden">
            <Link href="/painel" className={ICON_BUTTON} title={admin.nav.dashboard}>
              <IconLayoutDashboard size={20} stroke={1.75} aria-hidden="true" />
              <span className="sr-only md:not-sr-only">{admin.nav.dashboard}</span>
            </Link>
            <Link href="/admin/conta" className={ICON_BUTTON} title={dashboard.links.account}>
              <IconUserCircle size={20} stroke={1.75} aria-hidden="true" />
              <span className="sr-only md:not-sr-only">{dashboard.links.account}</span>
            </Link>
            <form action={signOut}>
              <button type="submit" className={ICON_BUTTON} title={auth.logout}>
                <IconLogout size={20} stroke={1.75} aria-hidden="true" />
                <span className="sr-only md:not-sr-only">{auth.logout}</span>
              </button>
            </form>
          </nav>
        </div>

        <AdminNav />

        <div className="mt-auto hidden flex-col gap-3 border-t border-white/10 p-3 lg:flex">
          <AdminAccountNav />
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <Avatar name={user.name} onNight />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ivory">{user.name}</p>
              <p className="truncate text-xs text-mist">{user.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className={ICON_ONLY}
                title={auth.logout}
                aria-label={auth.logout}
              >
                <IconLogout size={20} stroke={1.75} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="lg:pl-64">
        {/* Focusable so the skip link moves focus here (screen readers then read on from it). */}
        <div id="conteudo" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}
