import { IconLayoutDashboard, IconPencil } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar } from '@/components/dashboard/avatar';
import { Fact, PageHeader, PageMain, Panel } from '@/components/dashboard/page-parts';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { buttonClasses } from '@/components/dashboard/styles';
import { ThemeSwatch } from '@/components/dashboard/theme-swatch';
import { AuditList } from '@/features/admin/audit-list';
import {
  DeleteEventControl,
  EventStatusControl,
  GuestLimitForm,
} from '@/features/admin/event-controls';
import { UsageMeter } from '@/features/admin/usage-meter';
import { formatLongDate, formatShortDate, formatTime } from '@/i18n/format';
import { admin, dashboard } from '@/i18n/pt-AO';
import { formatRelativeDay } from '@/i18n/relative';
import { auditQuery } from '@/lib/admin/filters';
import { serverNow } from '@/lib/clock';
import { fillTemplate } from '@/lib/template';
import { requireAdmin } from '@/server/admin/access';
import { loadAdminEvent } from '@/server/admin/queries';
import { listAuditEntries } from '@/server/audit/queries';
import { getTheme } from '@/themes';

const t = admin.event;

export const metadata: Metadata = { title: admin.events.title };

/** One event: its details and account, its status and plan, and the admin changes made to it. */
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
  const now = serverNow();

  return (
    <PageMain>
      <PageHeader
        parents={[{ href: '/admin', label: t.back }]}
        title={<span className="lining-nums">{couple}</span>}
        serif
        badges={
          <>
            <StatusBadge tone={event.isActive ? 'good' : 'bad'} dot>
              {event.isActive ? admin.events.active : admin.events.inactive}
            </StatusBadge>
            <StatusBadge>{dashboard.events.phase[event.phase]}</StatusBadge>
          </>
        }
        description={
          <>
            {formatLongDate(event.startsAt)}, {formatTime(event.startsAt)} ·{' '}
            {formatRelativeDay(event.startsAt, now)}
          </>
        }
        actions={
          <>
            <Link href={`/painel/eventos/${event.id}`} className={buttonClasses('secondary')}>
              <IconLayoutDashboard size={18} stroke={1.75} aria-hidden="true" />
              {t.openDashboard}
            </Link>
            <Link href={`/painel/eventos/${event.id}/editar`} className={buttonClasses('primary')}>
              <IconPencil size={18} stroke={1.75} aria-hidden="true" />
              {t.edit}
            </Link>
          </>
        }
      />

      {/* Phones: details, controls, activity. Wide screens: the controls in a column on the right. */}
      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
        <Panel
          id="detalhes"
          title={t.details}
          description={fillTemplate(t.created, { date: formatShortDate(event.createdAt) })}
          className="lg:col-span-2"
        >
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Fact label={t.account} className="sm:col-span-2">
              <span className="flex items-center gap-3">
                <Avatar name={event.owner.name} size="md" />
                <span className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/contas/${event.owner.id}`}
                      className="font-medium underline decoration-stone-300 underline-offset-2 hover:decoration-stone-900"
                    >
                      {event.owner.name}
                    </Link>
                    {event.owner.banned ? (
                      <StatusBadge tone="bad" dot>
                        {t.suspendedAccount}
                      </StatusBadge>
                    ) : null}
                  </span>
                  <span className="break-all text-stone-600">{event.owner.email}</span>
                </span>
              </span>
            </Fact>
            <Fact label={t.theme}>
              <span className="flex items-center gap-2">
                <ThemeSwatch themeId={event.themeId} />
                {getTheme(event.themeId).name}
              </span>
            </Fact>
            <Fact label={t.address}>
              <span className="font-mono text-[0.8125rem] break-all">/c/{event.slug}/…</span>
            </Fact>
            <Fact label={t.guests}>
              <span className="flex flex-col gap-1.5">
                <span className="tabular-nums">
                  {fillTemplate(admin.events.guests, {
                    count: String(event._count.guests),
                    limit: String(event.guestLimit),
                  })}
                </span>
                <UsageMeter value={event._count.guests} max={event.guestLimit} className="w-40" />
              </span>
            </Fact>
            <Fact label={t.people}>
              <span className="text-2xl font-semibold text-stone-900 tabular-nums">
                {event.confirmedPeople}
              </span>
            </Fact>
          </dl>
        </Panel>

        <div className="flex flex-col gap-6 lg:row-span-2">
          <Panel id="estado" title={t.status.legend}>
            <EventStatusControl eventId={event.id} isActive={event.isActive} couple={couple} />
          </Panel>
          <Panel id="limite" title={t.limit.legend}>
            <GuestLimitForm
              eventId={event.id}
              guestLimit={event.guestLimit}
              guestCount={event._count.guests}
            />
          </Panel>
          <Panel id="eliminar" title={t.delete.legend} tone="danger">
            <DeleteEventControl
              eventId={event.id}
              slug={event.slug}
              couple={couple}
              guestCount={event._count.guests}
            />
          </Panel>
        </div>

        <Panel
          id="atividade"
          title={admin.audit.recent}
          flush
          className="overflow-hidden lg:col-span-2"
          actions={
            history.total > history.items.length ? (
              <Link
                href={`/admin/registo${auditQuery({ target: { type: 'event', id: event.id } })}`}
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
