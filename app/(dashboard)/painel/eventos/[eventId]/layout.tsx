import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/painel"
              className={buttonClasses('ghost', 'icon', '-ml-2')}
              aria-label={eventNav.back}
            >
              <IconArrowLeft size={20} stroke={1.75} aria-hidden="true" />
            </Link>
            <p className="min-w-0 truncate font-serif text-xl text-stone-900">
              {header.groomName} &amp; {header.brideName}
            </p>
            <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 font-sans text-xs font-medium text-stone-700">
              {dashboard.events.phase[header.phase]}
            </span>
          </div>
          {header.isActive ? null : (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 font-sans text-sm text-red-800">
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
