import { IconCalendarPlus, IconChevronRight, IconInbox, IconInfoCircle } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar } from '@/components/dashboard/avatar';
import {
  Callout,
  EmptyState,
  PageHeader,
  PageMain,
  Panel,
} from '@/components/dashboard/page-parts';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { buttonClasses } from '@/components/dashboard/styles';
import { getServerEnv } from '@/env';
import {
  AccountDetailsForm,
  DeleteAccountControl,
  PasswordResetControl,
  SuspensionControl,
} from '@/features/admin/account-controls';
import { AuditList } from '@/features/admin/audit-list';
import { formatShortDate } from '@/i18n/format';
import { admin, dashboard } from '@/i18n/pt-AO';
import { formatRelativeDay } from '@/i18n/relative';
import { auditQuery } from '@/lib/admin/filters';
import { serverNow } from '@/lib/clock';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { loadAccount } from '@/server/admin/queries';
import { listAuditEntries } from '@/server/audit/queries';

const t = admin.accountDetail;

export const metadata: Metadata = { title: admin.accounts.title };

/** One account: its events, details, password, access, and the admin changes made to it. */
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
  const now = serverNow();
  const canCreateEvent = account.role === 'couple' && !account.suspended;

  return (
    <PageMain>
      <PageHeader
        parents={[{ href: '/admin/contas', label: t.back }]}
        leading={<Avatar name={account.name} size="lg" />}
        title={<span className="break-all">{account.name}</span>}
        badges={
          <>
            <StatusBadge tone={account.role === 'admin' ? 'dark' : 'neutral'}>
              {admin.accounts.roles[account.role]}
            </StatusBadge>
            {account.suspended ? (
              <StatusBadge tone="bad" dot>
                {admin.accounts.suspended}
              </StatusBadge>
            ) : null}
            {own ? <StatusBadge tone="warn">{admin.common.you}</StatusBadge> : null}
          </>
        }
        description={
          <>
            <span className="break-all">{account.email}</span> ·{' '}
            {fillTemplate(admin.accounts.created, { date: formatShortDate(account.createdAt) })}
          </>
        }
      />

      {own ? (
        <Callout icon={<IconInfoCircle size={18} stroke={1.75} aria-hidden="true" />}>
          {t.ownAccount}{' '}
          <Link href="/admin/conta" className="font-medium underline underline-offset-2">
            {t.ownAccountLink}
          </Link>
          .
        </Callout>
      ) : null}

      {/* Phones: events, the account's settings, activity. Wide screens: settings on the right. */}
      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
        <Panel
          id="eventos"
          title={t.events.title}
          flush
          className="overflow-hidden lg:col-span-2"
          actions={
            canCreateEvent ? (
              <Link
                href={`/admin/eventos/novo?conta=${encodeURIComponent(account.id)}`}
                className={buttonClasses('secondary', 'sm')}
              >
                <IconCalendarPlus size={16} stroke={1.75} aria-hidden="true" />
                {t.events.create}
              </Link>
            ) : null
          }
        >
          {account.events.length === 0 ? (
            <EmptyState icon={<IconInbox size={24} stroke={1.5} aria-hidden="true" />}>
              {t.events.empty}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-stone-100">
              {account.events.map((event) => {
                const couple = `${event.groomName} & ${event.brideName}`;
                return (
                  <li
                    key={event.id}
                    className="group relative flex items-center gap-3 px-5 py-4 transition-colors hover:bg-stone-50"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/eventos/${event.id}`}
                          aria-label={fillTemplate(admin.events.manageLabel, { couple })}
                          className="font-serif text-lg leading-snug text-stone-900 lining-nums after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-stone-900"
                        >
                          {couple}
                        </Link>
                        <StatusBadge tone={event.isActive ? 'good' : 'bad'} dot>
                          {event.isActive ? admin.events.active : admin.events.inactive}
                        </StatusBadge>
                        <StatusBadge>{dashboard.events.phase[event.phase]}</StatusBadge>
                      </div>
                      <p className="text-sm text-stone-600">
                        <span className="tabular-nums">{formatShortDate(event.startsAt)}</span> ·{' '}
                        {formatRelativeDay(event.startsAt, now)} ·{' '}
                        <span className="font-mono text-xs break-all">/c/{event.slug}</span>
                      </p>
                    </div>
                    <IconChevronRight
                      size={18}
                      stroke={2}
                      aria-hidden="true"
                      className="shrink-0 text-stone-400 transition-colors group-hover:text-stone-700"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-6 lg:row-span-2">
          <Panel id="dados" title={t.details.legend}>
            <AccountDetailsForm
              userId={account.id}
              initialValues={{ name: account.name, email: account.email }}
              nameHint={account.role === 'admin' ? null : undefined}
            />
          </Panel>
          {own ? null : (
            <>
              <Panel id="palavra-passe" title={t.password.legend}>
                <PasswordResetControl
                  userId={account.id}
                  name={account.name}
                  loginUrl={new URL('/entrar', getServerEnv().APP_URL).toString()}
                />
              </Panel>
              <Panel id="acesso" title={t.access.legend}>
                <SuspensionControl
                  userId={account.id}
                  name={account.name}
                  suspended={account.suspended}
                />
              </Panel>
              <Panel id="eliminar" title={t.delete.legend} tone="danger">
                <DeleteAccountControl
                  userId={account.id}
                  name={account.name}
                  email={account.email}
                  events={account.events.map((event) => ({
                    id: event.id,
                    couple: `${event.groomName} & ${event.brideName}`,
                    slug: event.slug,
                    guests: event._count.guests,
                  }))}
                />
              </Panel>
            </>
          )}
        </div>

        <Panel
          id="atividade"
          title={admin.audit.recent}
          flush
          className="overflow-hidden lg:col-span-2"
          actions={
            history.total > history.items.length ? (
              <Link
                href={`/admin/registo${auditQuery({ target: { type: 'user', id: account.id } })}`}
                className="text-sm font-medium text-stone-800 underline underline-offset-4 hover:text-stone-950"
              >
                {admin.audit.all}
              </Link>
            ) : null
          }
        >
          <AuditList entries={history.items} now={now} headingLevel={3} />
        </Panel>
      </div>
    </PageMain>
  );
}
