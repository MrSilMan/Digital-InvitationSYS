import { formatLongDate } from '@/i18n/format';
import { invitation } from '@/i18n/pt-AO';

import { capitalize, coupleNamesShort, fillTemplate } from './text';
import type { InvitationEvent } from './types';

/** Texts of the WhatsApp link preview. Event-level only: never the guest's name. */

type PreviewEvent = Pick<InvitationEvent, 'phase' | 'groomName' | 'brideName' | 'startsAt'>;

/** "Convite de Casamento – Braúlio & Nanda" (or "Save the Date – …" before the invitation). */
export function invitationTitle(event: PreviewEvent): string {
  const template =
    event.phase === 'SAVE_THE_DATE'
      ? invitation.metadata.saveTheDateTitle
      : invitation.metadata.invitationTitle;
  return fillTemplate(template, { couple: coupleNamesShort(event) });
}

/** "Sexta-feira, 15 de janeiro de 2027. Toque para abrir o seu convite." */
export function invitationDescription(event: PreviewEvent): string {
  return fillTemplate(invitation.metadata.description, {
    date: capitalize(formatLongDate(new Date(event.startsAt))),
  });
}
