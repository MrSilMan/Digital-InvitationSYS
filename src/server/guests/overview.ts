import 'server-only';

import { guestGroups } from '@/lib/guests/filters';
import { answerStatus, type AnswerStatus, type GuestStats, guestStats } from '@/lib/guests/status';
import { getPrisma } from '@/server/db/prisma';

/** The overview ("Resumo") of an event's answers. Callers have checked access. */

export interface GuestMessage {
  guestId: string;
  displayName: string;
  answer: AnswerStatus;
  message: string;
  /** When the answer (with its message) was last saved. */
  at: Date;
}

export interface EventOverview {
  guestLimit: number;
  /** Every group of the event, for the filter. */
  groups: string[];
  /** For the selected group (or every guest). */
  stats: GuestStats;
  messages: GuestMessage[];
}

export async function loadOverview(
  eventId: string,
  group: string | null,
): Promise<EventOverview | null> {
  const event = await getPrisma().event.findUnique({
    where: { id: eventId },
    select: {
      guestLimit: true,
      guests: {
        select: {
          id: true,
          displayName: true,
          seatsAllowed: true,
          groupTag: true,
          invitationSentAt: true,
          rsvp: {
            select: {
              attending: true,
              peopleCount: true,
              whatsappIntentAt: true,
              message: true,
              updatedAt: true,
            },
          },
          _count: { select: { views: true } },
        },
      },
    },
  });
  if (!event) return null;

  const all = event.guests.map((guest) => ({
    ...guest,
    sentAt: guest.invitationSentAt,
    viewCount: guest._count.views,
  }));
  const selected = group ? all.filter((guest) => guest.groupTag === group) : all;
  const messages = selected
    .flatMap((guest): GuestMessage[] =>
      guest.rsvp?.message
        ? [
            {
              guestId: guest.id,
              displayName: guest.displayName,
              answer: answerStatus(guest),
              message: guest.rsvp.message,
              at: guest.rsvp.updatedAt,
            },
          ]
        : [],
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    guestLimit: event.guestLimit,
    groups: guestGroups(all),
    stats: guestStats(selected),
    messages,
  };
}
