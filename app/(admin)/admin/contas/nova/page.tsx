import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses } from '@/components/dashboard/styles';
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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/contas" className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          <IconArrowLeft size={18} stroke={1.75} aria-hidden="true" />
          {admin.accountDetail.back}
        </Link>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-stone-600">{t.intro}</p>
      </div>
      <NewAccount loginUrl={new URL('/entrar', getServerEnv().APP_URL).toString()} />
    </main>
  );
}
