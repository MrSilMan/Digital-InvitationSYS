import { invitation } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

import type { InvitationEvent } from './types';

export { fillTemplate };

type Couple = Pick<InvitationEvent, 'groomName' | 'brideName'>;

/** "Braúlio e Nanda" */
export function coupleNames(event: Couple): string {
  return fillTemplate(invitation.couple, { groom: event.groomName, bride: event.brideName });
}

/** "Braúlio & Nanda" */
export function coupleNamesShort(event: Couple): string {
  return fillTemplate(invitation.coupleShort, { groom: event.groomName, bride: event.brideName });
}

/** "sexta-feira, …" → "Sexta-feira, …" */
export function capitalize(text: string): string {
  const [first = '', ...rest] = Array.from(text);
  return first.toLocaleUpperCase('pt-AO') + rest.join('');
}
