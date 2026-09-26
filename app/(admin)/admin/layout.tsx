import type { Metadata, Viewport } from 'next';

import { AdminShell } from '@/features/admin/admin-shell';
import { SentryUser } from '@/features/dashboard/sentry-user';
import { admin, app } from '@/i18n/pt-AO';
import { requireAdmin } from '@/server/admin/access';

export const metadata: Metadata = {
  title: { default: admin.title, template: `%s · ${admin.title} · ${app.name}` },
  robots: { index: false, follow: false },
};

/** The phone's status bar takes the colour of the admin's night bar. */
export const viewport: Viewport = { themeColor: '#161d2c' };

/**
 * Shell of the admin area (admins only; couples get "not found"). Every page and Server Action
 * below checks the role again: a layout does not protect the pages under it.
 */
export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const user = await requireAdmin();
  return (
    <AdminShell user={user}>
      <SentryUser id={user.id} role={user.role} />
      {children}
    </AdminShell>
  );
}
