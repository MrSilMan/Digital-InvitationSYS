import { after } from 'next/server';
import { z } from 'zod';

import { whatsappUrl } from '@/features/invitation/links';
import { acceptsWhatsapp, rsvpClosed } from '@/features/invitation/rsvp/rules';
import { fillTemplate } from '@/features/invitation/text';
import { t } from '@/i18n';
import { serverNow } from '@/lib/clock';
import { logger } from '@/lib/logger';
import { invitationParamsSchema } from '@/lib/validation/invitation';
import { getInvitation } from '@/server/invitations/queries';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';
import { recordWhatsappIntent } from '@/server/rsvp/rsvp-service';

const TARGETS = { noivo: 'GROOM', noiva: 'BRIDE' } as const;

const paramsSchema = invitationParamsSchema.extend({
  target: z.enum(['noivo', 'noiva']),
});

function notFound(): Response {
  return new Response(t.invitation.notFound.title, {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * The WhatsApp RSVP buttons: records the tap as a confirmation intent (after the response, never
 * overwriting a form answer, rate-limited per guest), then forwards to wa.me with the pre-filled
 * message. The tap is not recorded after the deadline; the guest still reaches WhatsApp.
 */
export async function GET(
  _request: Request,
  context: RouteContext<'/c/[eventSlug]/[guestToken]/whatsapp/[target]'>,
) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) return notFound();
  const { eventSlug, guestToken, target } = params.data;
  const invitation = await getInvitation(eventSlug, guestToken);
  if (!invitation || !acceptsWhatsapp(invitation.event)) return notFound();

  const { event, guest } = invitation;
  const phone = target === 'noivo' ? event.rsvp.groomWhatsapp : event.rsvp.brideWhatsapp;
  if (!phone) return notFound();

  const now = serverNow();
  if (!rsvpClosed(event, now)) {
    after(async () => {
      try {
        const limit = await rateLimit(RATE_LIMITS.whatsappPerGuest, guestToken);
        if (!limit.allowed) {
          logger.warn('WhatsApp RSVP tap not recorded: rate limited', { guestId: guest.id });
          return;
        }
        await recordWhatsappIntent(guest.id, TARGETS[target], now);
        logger.info('WhatsApp RSVP intent recorded', {
          eventId: event.id,
          guestId: guest.id,
          target: TARGETS[target],
        });
      } catch (err) {
        logger.error('Could not record a WhatsApp RSVP intent', { err, guestId: guest.id });
      }
    });
  }

  const message = fillTemplate(t.invitation.sections.rsvp.whatsappMessage, {
    guest: guest.displayName,
    groom: event.groomName,
    bride: event.brideName,
  });
  return new Response(null, {
    status: 303,
    headers: { Location: whatsappUrl(phone, message), 'Cache-Control': 'no-store' },
  });
}
