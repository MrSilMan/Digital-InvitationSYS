import type { Metadata } from 'next';

import { PageHeader, PageMain } from '@/components/dashboard/page-parts';
import { getServerEnv } from '@/env';
import { NewAccount } from '@/features/admin/new-account';
import { admin } from '@/i18n/pt-AO';
import { requireAdmin } from '@/server/admin/access';

const t = admin.newAccount;

export const metadata: Metadata = { title: t.title };

/** Creates a couple's account (without an event: "Novo evento" can create both at once). */
export default async function NewAccountPage() {
  await requireAdmin();
  return (
    <PageMain width="narrow">
      <PageHeader
        parents={[{ href: '/admin/contas', label: admin.accountDetail.back }]}
        title={t.title}
        description={t.intro}
      />
      <NewAccount loginUrl={new URL('/entrar', getServerEnv().APP_URL).toString()} />
    </PageMain>
  );
}
