'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { clientIp } from '@/lib/client-ip';
import { serverNow } from '@/lib/clock';
import { logger } from '@/lib/logger';
import { invitationParamsSchema } from '@/lib/validation/invitation';
import { rsvpAnswerSchema } from '@/lib/validation/rsvp';
import { getInvitation } from '@/server/invitations/queries';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';
import { saveFormRsvp } from '@/server/rsvp/rsvp-service';

import type { GuestRsvp } from '../types';

import { acceptsForm, rsvpClosed } from './rules';

export type RsvpErrorCode =
  'not-found' | 'not-allowed' | 'closed' | 'rate-limited' | 'invalid' | 'unavailable';

export type SubmitRsvpResult = { ok: true; rsvp: GuestRsvp } | { ok: false; error: RsvpErrorCode };

const requestSchema = invitationParamsSchema.extend({ answer: z.unknown() });

/**
 * Saves the RSVP form of the guest behind (eventSlug, guestToken). Nothing from the browser is
 * trusted: the link, the event (active, form mode), the deadline and the rate limits are checked
 * here, and the answer is validated against the guest's seats from the database.
 */
export async function submitRsvp(input: unknown): Promise<SubmitRsvpResult> {
  const request = requestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: 'invalid' };
  const { eventSlug, guestToken } = request.data;

  const invitation = await getInvitation(eventSlug, guestToken);
  if (!invitation) return { ok: false, error: 'not-found' };
  const { event, guest } = invitation;
  if (!acceptsForm(event)) return { ok: false, error: 'not-allowed' };
  if (rsvpClosed(event, serverNow())) return { ok: false, error: 'closed' };

  const ip = clientIp(await headers());
  const [perGuest, perIp] = await Promise.all([
    rateLimit(RATE_LIMITS.rsvpPerGuest, guestToken),
    rateLimit(RATE_LIMITS.rsvpPerIp, ip),
  ]);
  if (!perGuest.allowed || !perIp.allowed) {
    logger.warn('RSVP rate limited', {
      eventId: event.id,
      guestId: guest.id,
      limit: perGuest.allowed ? 'ip' : 'guest',
    });
    return { ok: false, error: 'rate-limited' };
  }

  const answer = rsvpAnswerSchema(guest.seatsAllowed).safeParse(request.data.answer);
  if (!answer.success) return { ok: false, error: 'invalid' };

  try {
    const rsvp = await saveFormRsvp(guest.id, answer.data);
    logger.info('RSVP saved', {
      eventId: event.id,
      guestId: guest.id,
      attending: answer.data.attending,
      peopleCount: answer.data.peopleCount,
    });
    return { ok: true, rsvp };
  } catch (err) {
    logger.error('RSVP could not be saved', { err, eventId: event.id, guestId: guest.id });
    return { ok: false, error: 'unavailable' };
  }
}
