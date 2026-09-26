import type { Metadata } from 'next';

import { Avatar } from '@/components/dashboard/avatar';
import { PageHeader, PageMain, Panel } from '@/components/dashboard/page-parts';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ChangePasswordForm } from '@/features/account/change-password-form';
import { AccountDetailsForm } from '@/features/admin/account-controls';
import { account, admin } from '@/i18n/pt-AO';
import { requireAdmin } from '@/server/admin/access';

export const metadata: Metadata = { title: account.title };

/**
 * The signed-in admin's own account, inside the admin area: name and e-mail (recorded in the
 * audit log like any account change) and the password (it asks for the current one).
 */
export default async function AdminOwnAccountPage() {
  const user = await requireAdmin();
  return (
    <PageMain>
      <PageHeader
        title={account.title}
        leading={<Avatar name={user.name} size="lg" />}
        badges={<StatusBadge tone="dark">{admin.accounts.roles.admin}</StatusBadge>}
        description={<span className="break-all">{user.email}</span>}
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panel id="dados" title={admin.accountDetail.details.legend}>
          <AccountDetailsForm
            userId={user.id}
            initialValues={{ name: user.name, email: user.email }}
            nameHint={null}
          />
        </Panel>
        <Panel
          id="palavra-passe"
          title={account.password.legend}
          description={account.password.hint}
        >
          <ChangePasswordForm />
        </Panel>
      </div>
    </PageMain>
  );
}
