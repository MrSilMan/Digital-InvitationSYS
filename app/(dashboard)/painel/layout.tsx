import { IconLogout, IconShieldCheck } from '@tabler/icons-react';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

import { Avatar } from '@/components/dashboard/avatar';
import { nightButtonClasses, nightFrameClasses } from '@/components/dashboard/styles';
import { Wordmark } from '@/components/dashboard/wordmark';
import { signOut } from '@/features/auth/actions';
import { SentryUser } from '@/features/dashboard/sentry-user';
import { app, auth, dashboard } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { requireUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: { default: dashboard.title, template: `%s · ${app.name}` },
  robots: { index: false, follow: false },
};

/** The phone's status bar takes the colour of the night header. */
export const viewport: Viewport = { themeColor: '#161d2c' };

/** An icon with its label next to it from `md` (only the icon on phones). */
const HEADER_BUTTON = cn(nightButtonClasses, 'px-2.5');

/**
 * Shell of the couple's dashboard: the landing page's night and gold around the dashboard's
 * light pages (like the login page before it). Every page below re-checks access to its own data.
 */
export default async function DashboardLayout({ children }: LayoutProps<'/painel'>) {
  const user = await requireUser();
  const accountHref = user.role === 'admin' ? '/admin/conta' : '/painel/conta';
  return (
    <div className="min-h-svh bg-stone-100 font-sans text-stone-900">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {dashboard.skipToContent}
      </a>
      <header className={nightFrameClasses}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/painel"
            className="flex min-w-0 flex-col rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Wordmark className="text-[1.75rem] sm:text-[2rem]" />
            <span className="text-[0.6875rem] font-semibold tracking-[0.2em] text-mist uppercase">
              {dashboard.tagline}
            </span>
          </Link>
          <nav aria-label={dashboard.links.label} className="flex shrink-0 items-center gap-1">
            {user.role === 'admin' ? (
              <Link href="/admin" className={HEADER_BUTTON} title={dashboard.links.admin}>
                <IconShieldCheck size={20} stroke={1.75} aria-hidden="true" />
                <span className="sr-only md:not-sr-only">{dashboard.links.admin}</span>
              </Link>
            ) : null}
            <Link href={accountHref} className={HEADER_BUTTON} title={dashboard.links.account}>
              <Avatar name={user.name} size="xs" onNight />
              <span className="sr-only md:not-sr-only">{dashboard.links.account}</span>
            </Link>
            <form action={signOut}>
              <button type="submit" className={HEADER_BUTTON} title={auth.logout}>
                <IconLogout size={20} stroke={1.75} aria-hidden="true" />
                <span className="sr-only md:not-sr-only">{auth.logout}</span>
              </button>
            </form>
          </nav>
        </div>
      </header>
      <SentryUser id={user.id} role={user.role} />
      {/* Focusable so the skip link moves focus here (screen readers then read on from it). */}
      <div id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </div>
    </div>
  );
}
