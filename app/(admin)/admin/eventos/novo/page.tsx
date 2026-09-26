import type { Metadata } from 'next';

import { PageHeader, PageMain } from '@/components/dashboard/page-parts';
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
    <PageMain width="form">
      <PageHeader
        parents={[{ href: '/admin', label: admin.event.back }]}
        title={t.title}
        description={t.intro}
      />
      <NewEventForm
        owners={owners}
        preselectedOwnerId={typeof conta === 'string' ? conta : null}
        appUrl={appUrl}
        loginUrl={new URL('/entrar', appUrl).toString()}
      />
    </PageMain>
  );
}
