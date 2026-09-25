import 'server-only';

import type { GuestAnswer, GuestListItem } from '@/features/dashboard/guests/types';
import { getServerEnv } from '@/env';
import type { Prisma } from '@/generated/prisma/client';
import { formatDate } from '@/i18n/format';
import { invitation } from '@/i18n/pt-AO';
import type { InviteContext } from '@/lib/guests/invite-message';
import { fillTemplate } from '@/lib/template';
import { getPrisma } from '@/server/db/prisma';

/**
 * The couple's guest list, for the dashboard (never for guest pages: those read one guest
 * through src/server/invitations). Callers have checked the session and the event's owner.
 */

/** The personal link: /c/<event slug>/<guest token> on the app's public address. */
export function guestLink(slug: string, token: string): string {
  return new URL(`/c/${slug}/${token}`, getServerEnv().APP_URL).toString();
}

export const guestListSelect = {
  id: true,
  token: true,
  displayName: true,
  phone: true,
  seatsAllowed: true,
  groupTag: true,
  invitationSentAt: true,
  createdAt: true,
  rsvp: {
    select: {
      attending: true,
      peopleCount: true,
      companionNames: true,
      message: true,
      source: true,
      updatedAt: true,
      whatsappIntentAt: true,
      whatsappIntentTarget: true,
    },
  },
  views: { select: { openedAt: true }, orderBy: { openedAt: 'desc' }, take: 1 },
  _count: { select: { views: true } },
} satisfies Prisma.GuestSelect;

export type GuestListRow = Prisma.GuestGetPayload<{ select: typeof guestListSelect }>;

function toGuestAnswer(rsvp: NonNullable<GuestListRow['rsvp']>): GuestAnswer {
  return {
    attending: rsvp.attending,
    peopleCount: rsvp.peopleCount,
    companionNames: rsvp.companionNames,
    message: rsvp.message,
    source: rsvp.source,
    updatedAt: rsvp.updatedAt.toISOString(),
    whatsappIntentAt: rsvp.whatsappIntentAt?.toISOString() ?? null,
    whatsappIntentTarget: rsvp.whatsappIntentTarget,
  };
}

export function toGuestListItem(slug: string, row: GuestListRow): GuestListItem {
  return {
    id: row.id,
    displayName: row.displayName,
    phone: row.phone,
    seatsAllowed: row.seatsAllowed,
    groupTag: row.groupTag,
    link: guestLink(slug, row.token),
    sentAt: row.invitationSentAt?.toISOString() ?? null,
    viewCount: row._count.views,
    lastOpenedAt: row.views[0]?.openedAt.toISOString() ?? null,
    rsvp: row.rsvp ? toGuestAnswer(row.rsvp) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

interface EventRef {
  id: string;
  slug: string;
}

/** Every guest of the event, oldest first (the list sorts them by name). */
export async function listGuests(event: EventRef): Promise<GuestListItem[]> {
  const rows = await getPrisma().guest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: 'asc' },
    select: guestListSelect,
  });
  return rows.map((row) => toGuestListItem(event.slug, row));
}

export async function findGuestItem(
  event: EventRef,
  guestId: string,
): Promise<GuestListItem | null> {
  const row = await getPrisma().guest.findFirst({
    where: { id: guestId, eventId: event.id },
    select: guestListSelect,
  });
  return row ? toGuestListItem(event.slug, row) : null;
}

/** What the guest pages of the dashboard show about the event itself. */
export async function loadGuestEvent(eventId: string) {
  const row = await getPrisma().event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      slug: true,
      phase: true,
      guestLimit: true,
      groomName: true,
      brideName: true,
      startsAt: true,
      inviteMessage: true,
    },
  });
  if (!row) return null;
  const invite: InviteContext = {
    phase: row.phase,
    template: row.inviteMessage,
    couple: fillTemplate(invitation.couple, { groom: row.groomName, bride: row.brideName }),
    date: formatDate(row.startsAt),
  };
  return { id: row.id, slug: row.slug, guestLimit: row.guestLimit, invite };
}
