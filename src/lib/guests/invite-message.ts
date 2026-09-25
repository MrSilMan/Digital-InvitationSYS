import { guests } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

/**
 * The WhatsApp message that carries each guest's personal link. The couple writes it with
 * Portuguese placeholders, stored as typed ({convidado}, {noivos}, {data}, {link}): it is only
 * used in the dashboard, never on the guest page.
 */

export type InvitePhase = 'SAVE_THE_DATE' | 'INVITATION';

export function defaultInviteMessage(phase: InvitePhase): string {
  return guests.template.defaults[phase];
}

/** What the placeholders stand for, the same for every guest of an event (built on the server). */
export interface InviteContext {
  phase: InvitePhase;
  /** The couple's own text; null = the suggested one for the phase. */
  template: string | null;
  /** "Braúlio e Nanda" */
  couple: string;
  /** "15 de janeiro de 2027" */
  date: string;
}

/** The message for one guest. The link is always in it: added at the end if the text drops it. */
export function buildInviteMessage(
  context: InviteContext,
  guest: { displayName: string; link: string },
): string {
  let text = context.template ?? defaultInviteMessage(context.phase);
  if (!text.includes('{link}')) text = `${text}\n\n{link}`;
  return fillTemplate(text, {
    convidado: guest.displayName,
    noivos: context.couple,
    data: context.date,
    link: guest.link,
  });
}
