import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StatusBadge } from '@/components/dashboard/status-badge';
import { buttonClasses } from '@/components/dashboard/styles';
import { EventNav } from '@/features/dashboard/event-nav';
import { dashboard, eventNav } from '@/i18n/pt-AO';
import { requireEditableEvent } from '@/server/events/access';
import { loadEventHeader } from '@/server/events/queries';

/**
 * The frame of one event's pages (overview, guests, editor): the couple's names and the menu.
 * Each page checks access again: a layout does not protect the pages below it.
 */
export default async function EventLayout({
  children,
  params,
}: LayoutProps<'/painel/eventos/[eventId]'>) {
  const { eventId } = await params;
  const { event } = await requireEditableEvent(eventId);
  const header = await loadEventHeader(event.id);
  if (!header) notFound();

  return (
    <>
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/painel"
              className={buttonClasses('ghost', 'icon', '-ml-2')}
              aria-label={eventNav.back}
            >
              <IconArrowLeft size={20} stroke={1.75} aria-hidden="true" />
            </Link>
            <p className="min-w-0 truncate font-serif text-xl text-stone-900 lining-nums">
              {header.groomName} &amp; {header.brideName}
            </p>
            <StatusBadge>{dashboard.events.phase[header.phase]}</StatusBadge>
          </div>
          {header.isActive ? null : (
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 font-sans text-sm text-red-800">
              <IconAlertTriangle
                size={18}
                stroke={1.75}
                aria-hidden="true"
                className="mt-px shrink-0"
              />
              {eventNav.inactive}
            </p>
          )}
          <div className="mt-2">
            <EventNav eventId={event.id} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
