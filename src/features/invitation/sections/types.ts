import type { ThemeDefinition } from '@/themes';

import type { InvitationEvent, InvitationGuest } from '../types';

/** What every invitation section receives from the page. */
export interface SectionProps {
  event: InvitationEvent;
  guest: InvitationGuest;
  theme: ThemeDefinition;
  /** Server time of this request (countdown, RSVP deadline). */
  now: Date;
  /** "/c/<slug>/<token>": base of the guest's own links (calendar file). */
  basePath: string;
}
