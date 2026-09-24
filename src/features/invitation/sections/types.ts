import type { ThemeDefinition } from '@/themes';

import type { GuestRsvp, InvitationEvent, InvitationGuest } from '../types';

/** What every invitation section receives from the page. */
export interface SectionProps {
  event: InvitationEvent;
  guest: InvitationGuest;
  /** The guest's saved answer (loaded only when the event uses the RSVP form). */
  rsvp: GuestRsvp | null;
  theme: ThemeDefinition;
  /** Server time of this request (countdown, RSVP deadline). */
  now: Date;
  /** The guest's link token: the RSVP form sends it back to the Server Action. */
  guestToken: string;
  /** "/c/<slug>/<token>": base of the guest's own links (calendar file, WhatsApp buttons). */
  basePath: string;
}
