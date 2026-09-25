'use server';

import { z } from 'zod';

import { serverNow } from '@/lib/clock';
import { logger } from '@/lib/logger';
import { coupleAnswerSchema, guestSchema, inviteMessageSchema } from '@/lib/validation/guest';
import { authorizeEventAction, type EditableEvent } from '@/server/events/access';
import { findGuestItem } from '@/server/guests/queries';
import {
  createGuest,
  deleteGuest,
  recordCoupleAnswer,
  renewGuestToken,
  saveInviteMessage,
  setInvitationSent,
  updateGuest,
} from '@/server/guests/service';
import { getPrisma } from '@/server/db/prisma';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

import type { GuestActionResult, GuestErrorCode, GuestFieldIssue, GuestListItem } from './types';

/**
 * The guest list's Server Actions. Nothing from the browser is trusted: every action checks the
 * session, the event's owner (or admin), a rate limit and its input. Logs carry IDs, never names
 * or phone numbers.
 */

const guestIdSchema = z.uuid();

type Authorized = { ok: true; event: EditableEvent } | { ok: false; error: GuestErrorCode };

async function authorize(eventId: unknown): Promise<Authorized> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return auth;
  const limit = await rateLimit(RATE_LIMITS.guestChangesPerUser, auth.user.id);
  if (!limit.allowed) return { ok: false, error: 'rate-limited' };
  return { ok: true, event: auth.event };
}

/** Runs a database step; failures are logged and answered with "unavailable". */
async function attempt<R extends { ok: boolean }>(
  what: string,
  eventId: string,
  step: () => Promise<R>,
): Promise<R | { ok: false; error: 'unavailable' }> {
  try {
    return await step();
  } catch (err) {
    logger.error(`Guest ${what} failed`, { err, eventId });
    return { ok: false, error: 'unavailable' };
  }
}

function toIssues(error: z.ZodError): GuestFieldIssue[] {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

/** The guest as the list shows it after a change. */
async function guestResult(
  event: EditableEvent,
  guestId: string,
): Promise<GuestActionResult<{ guest: GuestListItem }>> {
  const guest = await findGuestItem(event, guestId);
  return guest ? { ok: true, guest } : { ok: false, error: 'not-found' };
}

export async function addGuest(
  eventId: unknown,
  input: unknown,
): Promise<GuestActionResult<{ guest: GuestListItem }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', issues: toIssues(parsed.error) };
  const { event } = auth;
  return attempt('creation', event.id, async () => {
    const created = await createGuest(event, parsed.data);
    if (!created.ok) {
      if (created.error === 'limit') logger.info('Guest limit reached', { eventId: event.id });
      return created;
    }
    logger.info('Guest added', { eventId: event.id, guestId: created.guestId });
    return guestResult(event, created.guestId);
  });
}

export async function editGuest(
  eventId: unknown,
  guestId: unknown,
  input: unknown,
): Promise<GuestActionResult<{ guest: GuestListItem }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const id = guestIdSchema.safeParse(guestId);
  if (!id.success) return { ok: false, error: 'invalid' };
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', issues: toIssues(parsed.error) };
  const { event } = auth;
  return attempt('update', event.id, async () => {
    const updated = await updateGuest(event, id.data, parsed.data);
    if (!updated.ok) return updated;
    logger.info('Guest updated', { eventId: event.id, guestId: id.data });
    return guestResult(event, id.data);
  });
}

export async function removeGuest(eventId: unknown, guestId: unknown): Promise<GuestActionResult> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const id = guestIdSchema.safeParse(guestId);
  if (!id.success) return { ok: false, error: 'invalid' };
  const { event } = auth;
  return attempt('deletion', event.id, async () => {
    if (!(await deleteGuest(event, id.data))) return { ok: false, error: 'not-found' };
    logger.info('Guest deleted', { eventId: event.id, guestId: id.data });
    return { ok: true };
  });
}

/** A new personal link; the old one stops working. */
export async function renewGuestLink(
  eventId: unknown,
  guestId: unknown,
): Promise<GuestActionResult<{ guest: GuestListItem }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const id = guestIdSchema.safeParse(guestId);
  if (!id.success) return { ok: false, error: 'invalid' };
  const { event } = auth;
  return attempt('link renewal', event.id, async () => {
    if (!(await renewGuestToken(event, id.data))) return { ok: false, error: 'not-found' };
    logger.info('Guest link renewed', { eventId: event.id, guestId: id.data });
    return guestResult(event, id.data);
  });
}

/** "Sent": set when the couple opens WhatsApp for the guest, or by hand (true / false). */
export async function markGuestSent(
  eventId: unknown,
  guestId: unknown,
  sent: unknown,
): Promise<GuestActionResult<{ guest: GuestListItem }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const id = guestIdSchema.safeParse(guestId);
  const flag = z.boolean().safeParse(sent);
  if (!id.success || !flag.success) return { ok: false, error: 'invalid' };
  const { event } = auth;
  return attempt('sent mark', event.id, async () => {
    const found = await setInvitationSent(event, id.data, flag.data ? serverNow() : null);
    if (!found) return { ok: false, error: 'not-found' };
    logger.info(flag.data ? 'Invitation marked as sent' : 'Invitation marked as not sent', {
      eventId: event.id,
      guestId: id.data,
    });
    return guestResult(event, id.data);
  });
}

/** An answer the couple received outside the invitation (WhatsApp, phone). */
export async function saveGuestAnswer(
  eventId: unknown,
  guestId: unknown,
  input: unknown,
): Promise<GuestActionResult<{ guest: GuestListItem }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const id = guestIdSchema.safeParse(guestId);
  if (!id.success) return { ok: false, error: 'invalid' };
  const { event } = auth;
  return attempt('answer', event.id, async () => {
    const guest = await getPrisma().guest.findFirst({
      where: { id: id.data, eventId: event.id },
      select: { seatsAllowed: true },
    });
    if (!guest) return { ok: false, error: 'not-found' };
    const parsed = coupleAnswerSchema(guest.seatsAllowed).safeParse(input);
    if (!parsed.success) return { ok: false, error: 'invalid', issues: toIssues(parsed.error) };
    const saved = await recordCoupleAnswer(event, id.data, parsed.data);
    if (!saved.ok) return saved;
    logger.info('Guest answer recorded by the couple', {
      eventId: event.id,
      guestId: id.data,
      attending: parsed.data.attending,
      peopleCount: parsed.data.peopleCount,
    });
    return guestResult(event, id.data);
  });
}

/** The message sent with every link; empty = back to the suggested text. */
export async function updateInviteMessage(
  eventId: unknown,
  text: unknown,
): Promise<GuestActionResult<{ template: string | null }>> {
  const auth = await authorize(eventId);
  if (!auth.ok) return auth;
  const parsed = inviteMessageSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: 'invalid', issues: toIssues(parsed.error) };
  const { event } = auth;
  return attempt('message update', event.id, async () => {
    await saveInviteMessage(event, parsed.data);
    logger.info('Invite message saved', { eventId: event.id, custom: parsed.data !== null });
    return { ok: true, template: parsed.data };
  });
}
