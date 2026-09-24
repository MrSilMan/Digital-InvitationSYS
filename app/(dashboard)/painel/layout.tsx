import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses } from '@/components/dashboard/styles';
import { signOut } from '@/features/auth/actions';
import { SentryUser } from '@/features/dashboard/sentry-user';
import { app, auth, dashboard } from '@/i18n/pt-AO';
import { requireUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: { default: dashboard.title, template: `%s · ${app.name}` },
  robots: { index: false, follow: false },
};

/** Shell of the couple's dashboard. Every page below re-checks access to its own data. */
export default async function DashboardLayout({ children }: LayoutProps<'/painel'>) {
  const user = await requireUser();
  return (
    <div className="min-h-svh bg-stone-100 font-sans text-stone-900">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {dashboard.skipToContent}
      </a>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/painel" className="font-serif text-xl text-stone-800">
            {app.name}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-stone-600 sm:inline">{user.name}</span>
            <form action={signOut}>
              <button type="submit" className={buttonClasses('secondary', 'sm')}>
                {auth.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <SentryUser id={user.id} role={user.role} />
      <div id="conteudo">{children}</div>
    </div>
  );
}
