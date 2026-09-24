import type { SectionId } from '@/lib/validation/sections';

import { canConfirm } from './rsvp/rules';
import type { InvitationEvent } from './types';

/** Whether a section has anything to show; empty optional sections are skipped. */
export function sectionHasContent(section: SectionId, event: InvitationEvent): boolean {
  switch (section) {
    case 'invitation':
    case 'countdown':
    case 'closing':
      return true;
    case 'message':
      return event.coupleMessage !== null;
    case 'gallery':
      return event.gallery.length > 0;
    case 'schedule':
      return event.locations.length > 0 || event.timeline.length > 0;
    case 'dressCode':
      return event.dressCode.text !== null || event.dressCode.colors.length > 0;
    case 'guestManual':
      return event.rules.length > 0;
    case 'gifts':
      return event.gifts.text !== null || event.gifts.iban !== null;
    case 'rsvp':
      return canConfirm(event);
  }
}

/** The invitation sections a guest sees, in the couple's order. */
export function sectionsToShow(event: InvitationEvent): SectionId[] {
  return event.sections
    .filter((section) => section.visible && sectionHasContent(section.id, event))
    .map((section) => section.id);
}
