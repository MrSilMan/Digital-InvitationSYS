import { IconInfoCircle } from '@tabler/icons-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Avatar } from '@/components/dashboard/avatar';
import { Fact, PageHeader, PageMain, Panel } from '@/components/dashboard/page-parts';
import { ChangePasswordForm } from '@/features/account/change-password-form';
import { account } from '@/i18n/pt-AO';
import { requireUser } from '@/server/auth/session';

const t = account;

export const metadata: Metadata = { title: t.title };

/**
 * The couple's own account: their details (changed by our team) and their password. Admins have
 * theirs inside the admin area, where they can also change their name and e-mail.
 */
export default async function AccountPage() {
  const user = await requireUser();
  if (user.role === 'admin') redirect('/admin/conta');
  return (
    <PageMain width="narrow">
      <PageHeader
        title={t.title}
        leading={<Avatar name={user.name} size="lg" />}
        description={<span className="break-all">{user.email}</span>}
      />
      <Panel id="os-seus-dados" title={t.details.legend}>
        <dl className="grid gap-5 sm:grid-cols-2">
          <Fact label={t.details.name}>{user.name}</Fact>
          <Fact label={t.details.email}>
            <span className="break-all">{user.email}</span>
          </Fact>
        </dl>
        <p className="mt-5 flex items-start gap-2 text-sm text-stone-600">
          <IconInfoCircle size={18} stroke={1.75} aria-hidden="true" className="mt-px shrink-0" />
          {t.details.hint}
        </p>
      </Panel>
      <Panel id="alterar-palavra-passe" title={t.password.legend} description={t.password.hint}>
        <ChangePasswordForm />
      </Panel>
    </PageMain>
  );
}
