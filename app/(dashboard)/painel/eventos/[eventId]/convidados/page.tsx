import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuestManager } from '@/features/dashboard/guests/guest-manager';
import { guests } from '@/i18n/pt-AO';
import { parseGuestFilters } from '@/lib/guests/filters';
import { requireEditableEvent } from '@/server/events/access';
import { listGuests, loadGuestEvent } from '@/server/guests/queries';

export const metadata: Metadata = { title: guests.title };

/** The guest list: add, edit, send each personal link by WhatsApp, follow the answers. */
export default async function GuestsPage({
  params,
  searchParams,
}: PageProps<'/painel/eventos/[eventId]/convidados'>) {
  const { eventId } = await params;
  const { event } = await requireEditableEvent(eventId);
  const [details, list] = await Promise.all([loadGuestEvent(event.id), listGuests(event)]);
  if (!details) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <GuestManager
        eventId={event.id}
        guestLimit={details.guestLimit}
        initialGuests={list}
        initialFilters={parseGuestFilters(await searchParams)}
        invite={details.invite}
      />
    </main>
  );
}
