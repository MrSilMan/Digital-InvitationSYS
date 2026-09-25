import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { getServerEnv } from '@/env';
import {
  AccountDetailsForm,
  PasswordResetControl,
  SuspensionControl,
} from '@/features/admin/account-controls';
import { AuditList } from '@/features/admin/audit-list';
import { StatusBadge } from '@/features/admin/status-badge';
import { formatLongDate, formatShortDate } from '@/i18n/format';
import { admin, dashboard } from '@/i18n/pt-AO';
import { auditQuery } from '@/lib/admin/filters';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { loadAccount } from '@/server/admin/queries';
import { listAuditEntries } from '@/server/audit/queries';

const t = admin.accountDetail;

export const metadata: Metadata = { title: admin.accounts.title };

function Card({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${cardClasses} flex flex-col gap-3 p-5`}>
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** One account: its details, events, password, access, and the admin changes made to it. */
export default async function AccountPage({ params }: PageProps<'/admin/contas/[userId]'>) {
  const user = await requireAdmin();
  const { userId } = await params;
  const account = await loadAccount(userId);
  if (!account) notFound();
  const own = account.id === user.id;
  const history = await listAuditEntries(
    { action: null, target: { type: 'user', id: account.id }, page: 1 },
    10,
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/contas" className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          <IconArrowLeft size={18} stroke={1.75} aria-hidden="true" />
          {t.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold break-all">{account.name}</h1>
          <StatusBadge tone={account.role === 'admin' ? 'dark' : 'neutral'}>
            {admin.accounts.roles[account.role]}
          </StatusBadge>
          {account.suspended ? (
            <StatusBadge tone="bad">{admin.accounts.suspended}</StatusBadge>
          ) : null}
        </div>
        <p className="text-sm text-stone-600">
          <span className="break-all">{account.email}</span> ·{' '}
          {fillTemplate(admin.accounts.created, { date: formatShortDate(account.createdAt) })}
        </p>
        {own ? <p className="text-sm text-stone-700">{t.ownAccount}</p> : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t.details.legend} id="dados">
          <AccountDetailsForm
            userId={account.id}
            initialValues={{ name: account.name, email: account.email }}
          />
        </Card>
        <Card title={t.events.title} id="eventos">
          {account.events.length === 0 ? (
            <p className="text-sm text-stone-600">{t.events.empty}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-stone-200">
              {account.events.map((event) => (
                <li key={event.id} className="flex flex-col gap-1 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/eventos/${event.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {event.groomName} &amp; {event.brideName}
                    </Link>
                    <StatusBadge tone={event.isActive ? 'good' : 'bad'}>
                      {event.isActive ? admin.events.active : admin.events.inactive}
                    </StatusBadge>
                    <StatusBadge>{dashboard.events.phase[event.phase]}</StatusBadge>
                  </div>
                  <p className="text-sm text-stone-600">
                    {formatLongDate(event.startsAt)} ·{' '}
                    <span className="break-all">/c/{event.slug}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {account.role === 'couple' && !account.suspended ? (
            <Link
              href={`/admin/eventos/novo?conta=${encodeURIComponent(account.id)}`}
              className={buttonClasses('secondary', 'sm', 'self-start')}
            >
              {t.events.create}
            </Link>
          ) : null}
        </Card>
        {own ? null : (
          <>
            <Card title={t.password.legend} id="palavra-passe">
              <PasswordResetControl
                userId={account.id}
                name={account.name}
                loginUrl={new URL('/entrar', getServerEnv().APP_URL).toString()}
              />
            </Card>
            <Card title={t.access.legend} id="acesso">
              <SuspensionControl
                userId={account.id}
                name={account.name}
                suspended={account.suspended}
              />
            </Card>
          </>
        )}
      </div>

      <section aria-labelledby="atividade" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="atividade" className="text-lg font-semibold">
            {admin.audit.recent}
          </h2>
          {history.total > history.items.length ? (
            <Link
              href={`/admin/registo${auditQuery({ target: { type: 'user', id: account.id } })}`}
              className="text-sm font-medium underline underline-offset-2"
            >
              {admin.audit.all}
            </Link>
          ) : null}
        </div>
        <AuditList entries={history.items} />
      </section>
    </main>
  );
}
