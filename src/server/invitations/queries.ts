import 'server-only';

import { cache } from 'react';

import type { Invitation, InvitationEvent, InvitationGuest } from '@/features/invitation/types';
import { isGuestToken } from '@/lib/guest-token';
import { logger } from '@/lib/logger';
import { isEventSlug } from '@/lib/validation/invitation';
import { getPrisma } from '@/server/db/prisma';

import { invitationEventSelect, toInvitationEvent } from './mapper';

/**
 * Guest page data, in two parts that Phase 5 caches separately in Redis: the event by slug (shared
 * by every guest) and the guest by token.
 */

export async function loadInvitationEvent(slug: string): Promise<InvitationEvent | null> {
  const row = await getPrisma().event.findUnique({
    where: { slug },
    select: invitationEventSelect,
  });
  return row ? toInvitationEvent(row) : null;
}

export async function loadInvitationGuest(
  token: string,
): Promise<{ eventId: string; guest: InvitationGuest } | null> {
  const row = await getPrisma().guest.findUnique({
    where: { token },
    select: { eventId: true, displayName: true, seatsAllowed: true },
  });
  return row
    ? {
        eventId: row.eventId,
        guest: { displayName: row.displayName, seatsAllowed: row.seatsAllowed },
      }
    : null;
}

/**
 * The invitation behind /c/<eventSlug>/<guestToken>, or null when the link is malformed, unknown,
 * points at another event, or the event is inactive. All of these look the same to the visitor.
 * Deduplicated per request (the page and its metadata share one lookup).
 */
export const getInvitation = cache(
  async (eventSlug: string, guestToken: string): Promise<Invitation | null> => {
    if (!isEventSlug(eventSlug) || !isGuestToken(guestToken)) return null;
    const [event, guest] = await Promise.all([
      loadInvitationEvent(eventSlug),
      loadInvitationGuest(guestToken),
    ]);
    if (!event || !guest || guest.eventId !== event.id || !event.isActive) {
      logger.debug('Invitation not found', {
        eventSlug,
        reason: !event
          ? 'unknown-event'
          : !guest
            ? 'unknown-guest'
            : !event.isActive
              ? 'inactive'
              : 'other-event',
      });
      return null;
    }
    return { event, guest: guest.guest };
  },
);
