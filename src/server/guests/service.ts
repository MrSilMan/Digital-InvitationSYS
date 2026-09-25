import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { createGuestToken } from '@/lib/guest-token';
import type { CoupleAnswer, GuestData } from '@/lib/validation/guest';
import { getPrisma } from '@/server/db/prisma';
import { invalidateInvitationGuest } from '@/server/invitations/queries';

/**
 * Changes to an event's guests. The Server Actions have checked the session, the event's owner
 * and the input; `event` comes from that check, and every query is scoped to it, so a guest ID
 * from another event is simply "not found". Whatever a guest page shows (name, seats, the link
 * itself) is dropped from the cache after a change.
 */

type Tx = Prisma.TransactionClient;

interface EventRef {
  id: string;
  slug: string;
}

/**
 * Locks the event's row until the transaction ends: two requests adding guests at the same time
 * (the form, an import) count and insert one after the other, so neither can pass the limit.
 */
export async function lockEvent(tx: Tx, eventId: string): Promise<{ guestLimit: number } | null> {
  const rows = await tx.$queryRaw<{ guestLimit: number }[]>`
    SELECT "guestLimit" FROM "event" WHERE "id" = ${eventId}::uuid FOR UPDATE`;
  return rows[0] ?? null;
}

/** A group written differently ("amigos", "Amigos") takes the spelling already in use. */
async function canonicalGroup(
  tx: Tx,
  eventId: string,
  groupTag: string | null,
  exceptGuestId?: string,
): Promise<string | null> {
  if (!groupTag) return null;
  const existing = await tx.guest.findFirst({
    where: {
      eventId,
      groupTag: { equals: groupTag, mode: 'insensitive' },
      ...(exceptGuestId ? { id: { not: exceptGuestId } } : {}),
    },
    select: { groupTag: true },
  });
  return existing?.groupTag ?? groupTag;
}

export type CreateGuestResult =
  { ok: true; guestId: string } | { ok: false; error: 'limit' | 'not-found' };

export async function createGuest(event: EventRef, data: GuestData): Promise<CreateGuestResult> {
  return getPrisma().$transaction(async (tx): Promise<CreateGuestResult> => {
    const locked = await lockEvent(tx, event.id);
    if (!locked) return { ok: false, error: 'not-found' };
    const count = await tx.guest.count({ where: { eventId: event.id } });
    if (count >= locked.guestLimit) return { ok: false, error: 'limit' };
    const guest = await tx.guest.create({
      data: {
        ...data,
        eventId: event.id,
        token: createGuestToken(),
        groupTag: await canonicalGroup(tx, event.id, data.groupTag),
      },
      select: { id: true },
    });
    return { ok: true, guestId: guest.id };
  });
}

export type UpdateGuestResult =
  | { ok: true }
  | { ok: false; error: 'not-found' }
  /** The guest already confirmed more people than the new seats. */
  | { ok: false; error: 'seats'; people: number };

export async function updateGuest(
  event: EventRef,
  guestId: string,
  data: GuestData,
): Promise<UpdateGuestResult> {
  type Outcome = Exclude<UpdateGuestResult, { ok: true }> | { ok: true; token: string };
  const result = await getPrisma().$transaction(async (tx): Promise<Outcome> => {
    const guest = await tx.guest.findFirst({
      where: { id: guestId, eventId: event.id },
      select: { token: true, rsvp: { select: { attending: true, peopleCount: true } } },
    });
    if (!guest) return { ok: false, error: 'not-found' };
    const people = guest.rsvp?.attending ? (guest.rsvp.peopleCount ?? 0) : 0;
    if (data.seatsAllowed < people) return { ok: false, error: 'seats', people };
    await tx.guest.update({
      where: { id: guestId },
      data: { ...data, groupTag: await canonicalGroup(tx, event.id, data.groupTag, guestId) },
    });
    return { ok: true, token: guest.token };
  });
  if (!result.ok) return result;
  await invalidateInvitationGuest(result.token);
  return { ok: true };
}

/** Deletes the guest with their answer and views; false when not in this event. */
export async function deleteGuest(event: EventRef, guestId: string): Promise<boolean> {
  const prisma = getPrisma();
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId: event.id },
    select: { token: true },
  });
  if (!guest) return false;
  const { count } = await prisma.guest.deleteMany({ where: { id: guestId, eventId: event.id } });
  await invalidateInvitationGuest(guest.token);
  return count > 0;
}

/**
 * A new personal link (the old one stops working at once). It has not been sent yet, so the guest
 * goes back to "por enviar".
 */
export async function renewGuestToken(event: EventRef, guestId: string): Promise<boolean> {
  const prisma = getPrisma();
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId: event.id },
    select: { token: true },
  });
  if (!guest) return false;
  const { count } = await prisma.guest.updateMany({
    where: { id: guestId, eventId: event.id, token: guest.token },
    data: { token: createGuestToken(), invitationSentAt: null },
  });
  await invalidateInvitationGuest(guest.token);
  return count > 0;
}

/** Records that the link was sent (now), or undoes it. False when not in this event. */
export async function setInvitationSent(
  event: EventRef,
  guestId: string,
  sentAt: Date | null,
): Promise<boolean> {
  const { count } = await getPrisma().guest.updateMany({
    where: { id: guestId, eventId: event.id },
    data: { invitationSentAt: sentAt },
  });
  return count > 0;
}

export type RecordAnswerResult =
  { ok: true } | { ok: false; error: 'not-found' } | { ok: false; error: 'seats' };

/**
 * An answer the couple received by WhatsApp or phone (source COUPLE). The guest's own message and
 * WhatsApp tap are kept; companions beyond the new people count are dropped. Clearing it leaves
 * the guest without an answer. A later answer by the guest in the invitation replaces it.
 */
export async function recordCoupleAnswer(
  event: EventRef,
  guestId: string,
  answer: CoupleAnswer,
): Promise<RecordAnswerResult> {
  return getPrisma().$transaction(async (tx): Promise<RecordAnswerResult> => {
    const guest = await tx.guest.findFirst({
      where: { id: guestId, eventId: event.id },
      select: { seatsAllowed: true, rsvp: { select: { companionNames: true } } },
    });
    if (!guest) return { ok: false, error: 'not-found' };
    if ((answer.peopleCount ?? 0) > guest.seatsAllowed) return { ok: false, error: 'seats' };

    const companionNames = answer.attending
      ? (guest.rsvp?.companionNames ?? []).slice(0, Math.max(0, (answer.peopleCount ?? 1) - 1))
      : [];
    const data = {
      source: 'COUPLE',
      attending: answer.attending,
      peopleCount: answer.peopleCount,
      companionNames,
    } as const;
    if (!guest.rsvp && answer.attending === null) return { ok: true };
    await tx.rsvp.upsert({
      where: { guestId },
      create: { guestId, ...data },
      update: data,
      select: { id: true },
    });
    return { ok: true };
  });
}

/** The text sent with each link; null = the suggested one. */
export async function saveInviteMessage(event: EventRef, text: string | null): Promise<void> {
  await getPrisma().event.update({ where: { id: event.id }, data: { inviteMessage: text } });
}
