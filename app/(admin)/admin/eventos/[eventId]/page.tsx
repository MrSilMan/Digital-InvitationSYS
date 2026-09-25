import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { AuditList } from '@/features/admin/audit-list';
import { EventStatusControl, GuestLimitForm } from '@/features/admin/event-controls';
import { StatusBadge } from '@/features/admin/status-badge';
import { formatLongDate, formatShortDate, formatTime } from '@/i18n/format';
import { admin, dashboard } from '@/i18n/pt-AO';
import { auditQuery } from '@/lib/admin/filters';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { loadAdminEvent } from '@/server/admin/queries';
import { listAuditEntries } from '@/server/audit/queries';
import { getTheme } from '@/themes';

const t = admin.event;

export const metadata: Metadata = { title: admin.events.title };

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

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</dt>
      <dd className="text-sm text-stone-900">{children}</dd>
    </div>
  );
}

/** One event: its account, status, plan (guest limit) and the admin changes made to it. */
export default async function AdminEventPage({ params }: PageProps<'/admin/eventos/[eventId]'>) {
  await requireAdmin();
  const { eventId } = await params;
  const event = await loadAdminEvent(eventId);
  if (!event) notFound();
  const history = await listAuditEntries(
    { action: null, target: { type: 'event', id: event.id }, page: 1 },
    10,
  );
  const couple = `${event.groomName} & ${event.brideName}`;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          <IconArrowLeft size={18} stroke={1.75} aria-hidden="true" />
          {t.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-3xl text-stone-900">{couple}</h1>
          <StatusBadge tone={event.isActive ? 'good' : 'bad'}>
            {event.isActive ? admin.events.active : admin.events.inactive}
          </StatusBadge>
          <StatusBadge>{dashboard.events.phase[event.phase]}</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/painel/eventos/${event.id}`} className={buttonClasses('secondary', 'sm')}>
            {t.openDashboard}
          </Link>
          <Link
            href={`/painel/eventos/${event.id}/editar`}
            className={buttonClasses('secondary', 'sm')}
          >
            {t.edit}
          </Link>
        </div>
      </div>

      <section className={`${cardClasses} p-5`} aria-label={couple}>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label={t.account}>
            <Link
              href={`/admin/contas/${event.owner.id}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {event.owner.name}
            </Link>
            <span className="block break-all text-stone-600">{event.owner.email}</span>
            {event.owner.banned ? (
              <span className="mt-1 inline-block">
                <StatusBadge tone="bad">{t.suspendedAccount}</StatusBadge>
              </span>
            ) : null}
          </Fact>
          <Fact label={t.date}>
            {formatLongDate(event.startsAt)}, {formatTime(event.startsAt)}
          </Fact>
          <Fact label={t.address}>
            <span className="break-all">/c/{event.slug}/…</span>
          </Fact>
          <Fact label={t.theme}>{getTheme(event.themeId).name}</Fact>
          <Fact label={t.guests}>
            {fillTemplate(admin.events.guests, {
              count: String(event._count.guests),
              limit: String(event.guestLimit),
            })}
          </Fact>
          <Fact label={t.people}>{event.confirmedPeople}</Fact>
        </dl>
        <p className="mt-4 text-xs text-stone-500">
          {fillTemplate(t.created, { date: formatShortDate(event.createdAt) })}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t.status.legend} id="estado">
          <EventStatusControl eventId={event.id} isActive={event.isActive} couple={couple} />
        </Card>
        <Card title={t.limit.legend} id="limite">
          <GuestLimitForm
            eventId={event.id}
            guestLimit={event.guestLimit}
            guestCount={event._count.guests}
          />
        </Card>
      </div>

      <section aria-labelledby="atividade" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="atividade" className="text-lg font-semibold">
            {admin.audit.recent}
          </h2>
          {history.total > history.items.length ? (
            <Link
              href={`/admin/registo${auditQuery({ target: { type: 'event', id: event.id } })}`}
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
