import type { InvitationEvent } from '../types';

/** RSVP rules shared by the page, the Server Action and the WhatsApp route (all server-checked). */

type RsvpSettings = Pick<InvitationEvent, 'rsvp'>;

export function acceptsForm(event: RsvpSettings): boolean {
  return event.rsvp.mode === 'FORM' || event.rsvp.mode === 'BOTH';
}

export function acceptsWhatsapp(event: RsvpSettings): boolean {
  return (
    (event.rsvp.mode === 'WHATSAPP' || event.rsvp.mode === 'BOTH') &&
    (event.rsvp.groomWhatsapp !== null || event.rsvp.brideWhatsapp !== null)
  );
}

/** Whether the guest has any way to answer. */
export function canConfirm(event: RsvpSettings): boolean {
  return acceptsForm(event) || acceptsWhatsapp(event);
}

/** Answers are accepted until the deadline (inclusive); no deadline means always. */
export function rsvpClosed(event: RsvpSettings, now: Date): boolean {
  return event.rsvp.deadline !== null && now.getTime() > Date.parse(event.rsvp.deadline);
}
