import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClasses } from '@/components/dashboard/styles';
import { getServerEnv } from '@/env';
import { NewEventForm } from '@/features/admin/new-event-form';
import { admin } from '@/i18n/pt-AO';
import { requireAdmin } from '@/server/admin/access';
import { listEventOwners } from '@/server/admin/queries';

const t = admin.newEvent;

export const metadata: Metadata = { title: t.title };

/** Creates an event (and, if needed, the couple's account). `?conta=<id>` picks the account. */
export default async function NewEventPage({ searchParams }: PageProps<'/admin/eventos/novo'>) {
  await requireAdmin();
  const { conta } = await searchParams;
  const owners = await listEventOwners();
  const appUrl = getServerEnv().APP_URL;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          <IconArrowLeft size={18} stroke={1.75} aria-hidden="true" />
          {admin.event.back}
        </Link>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-stone-600">{t.intro}</p>
      </div>
      <NewEventForm
        owners={owners}
        preselectedOwnerId={typeof conta === 'string' ? conta : null}
        appUrl={appUrl}
        loginUrl={new URL('/entrar', appUrl).toString()}
      />
    </main>
  );
}
