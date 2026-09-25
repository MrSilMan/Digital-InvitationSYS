import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses } from '@/components/dashboard/styles';
import { signOut } from '@/features/auth/actions';
import { AdminNav } from '@/features/admin/admin-nav';
import { SentryUser } from '@/features/dashboard/sentry-user';
import { admin, app, auth, dashboard } from '@/i18n/pt-AO';
import { requireAdmin } from '@/server/admin/access';

export const metadata: Metadata = {
  title: { default: admin.title, template: `%s · ${admin.title} · ${app.name}` },
  robots: { index: false, follow: false },
};

/**
 * Shell of the admin area (admins only; couples get "not found"). Every page and Server Action
 * below checks the role again: a layout does not protect the pages under it.
 */
export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const user = await requireAdmin();
  return (
    <div className="min-h-svh bg-stone-100 font-sans text-stone-900">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {dashboard.skipToContent}
      </a>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-serif text-xl text-stone-800">
              {app.name}
            </Link>
            <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-medium text-white">
              {admin.title}
            </span>
          </div>
          <nav aria-label={dashboard.links.label} className="flex items-center gap-1">
            <Link href="/painel" className={buttonClasses('ghost', 'sm')}>
              {admin.nav.dashboard}
            </Link>
            <Link href="/painel/conta" className={buttonClasses('ghost', 'sm')}>
              {dashboard.links.account}
            </Link>
            <form action={signOut}>
              <button type="submit" className={buttonClasses('secondary', 'sm')}>
                {auth.logout}
              </button>
            </form>
          </nav>
        </div>
        <div className="mx-auto mt-2 max-w-7xl px-4">
          <AdminNav />
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
