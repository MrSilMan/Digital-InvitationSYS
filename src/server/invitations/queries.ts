import 'server-only';

import type { Redis } from 'ioredis';
import { cache } from 'react';

import type { Invitation, InvitationEvent, InvitationGuest } from '@/features/invitation/types';
import { isGuestToken } from '@/lib/guest-token';
import { logger } from '@/lib/logger';
import { isEventSlug } from '@/lib/validation/invitation';
import { cacheDelete, cacheGet, cacheSet, hashKeyPart } from '@/server/cache/json-cache';
import { getPrisma } from '@/server/db/prisma';

import { invitationEventSelect, toInvitationEvent } from './mapper';

/**
 * Guest page data, in two parts cached separately in Redis: the event by slug (shared by every
 * guest) and the guest by token (hashed in the key). Without Redis both come from Postgres.
 *
 * Whatever changes what a guest page shows must invalidate the cache: the couple's edits
 * (invalidateInvitationEvent, Phase 7), guest edits (invalidateInvitationGuest, Phase 8) and admin
 * activation changes (Phase 9). RSVPs are not cached.
 */

/** Bump when InvitationEvent or CachedGuest change shape, so old entries are never read. */
const CACHE_VERSION = 2;
const EVENT_TTL_SECONDS = 10 * 60;
const GUEST_TTL_SECONDS = 10 * 60;

const eventKey = (slug: string) => `inv:v${CACHE_VERSION}:event:${slug}`;
const guestKey = (token: string) => `inv:v${CACHE_VERSION}:guest:${hashKeyPart(token)}`;

interface CachedGuest {
  eventId: string;
  guest: InvitationGuest;
}

/** Test seam: which Redis client to use (default: the shared one; null simulates an outage). */
interface CacheOptions {
  redis?: Redis | null;
}

export async function loadInvitationEvent(
  slug: string,
  options: CacheOptions = {},
): Promise<InvitationEvent | null> {
  const cached = await cacheGet<InvitationEvent>(eventKey(slug), options.redis);
  if (cached) return cached;
  const row = await getPrisma().event.findUnique({
    where: { slug },
    select: invitationEventSelect,
  });
  if (!row) return null;
  const event = toInvitationEvent(row);
  await cacheSet(eventKey(slug), event, EVENT_TTL_SECONDS, options.redis);
  return event;
}

export async function loadInvitationGuest(
  token: string,
  options: CacheOptions = {},
): Promise<CachedGuest | null> {
  const cached = await cacheGet<CachedGuest>(guestKey(token), options.redis);
  if (cached) return cached;
  const row = await getPrisma().guest.findUnique({
    where: { token },
    select: { id: true, eventId: true, displayName: true, seatsAllowed: true },
  });
  if (!row) return null;
  const guest: CachedGuest = {
    eventId: row.eventId,
    guest: { id: row.id, displayName: row.displayName, seatsAllowed: row.seatsAllowed },
  };
  await cacheSet(guestKey(token), guest, GUEST_TTL_SECONDS, options.redis);
  return guest;
}

function notFoundReason(
  event: InvitationEvent | null,
  guest: CachedGuest | null,
): 'unknown-event' | 'unknown-guest' | 'inactive' | 'other-event' | null {
  if (!event) return 'unknown-event';
  if (!guest) return 'unknown-guest';
  if (guest.eventId !== event.id) return 'other-event';
  if (!event.isActive) return 'inactive';
  return null;
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
    const reason = notFoundReason(event, guest);
    if (reason || !event || !guest) {
      logger.debug('Invitation not found', { eventSlug, reason });
      return null;
    }
    return { event, guest: guest.guest };
  },
);

/** After the couple (or an admin) changes an event: its guests see the change right away. */
export async function invalidateInvitationEvent(slug: string): Promise<void> {
  await cacheDelete([eventKey(slug)]);
}

/** After a guest is edited or deleted (Phase 8). */
export async function invalidateInvitationGuest(token: string): Promise<void> {
  await cacheDelete([guestKey(token)]);
}

/** After a whole event is deleted: every guest's cached copy, a few hundred keys at a time. */
export async function invalidateInvitationGuests(tokens: readonly string[]): Promise<void> {
  for (let start = 0; start < tokens.length; start += 500) {
    await cacheDelete(tokens.slice(start, start + 500).map(guestKey));
  }
}
