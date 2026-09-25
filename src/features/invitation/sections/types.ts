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
  /** The dashboard's preview: a sample guest, and nothing a guest could send or record. */
  preview?: boolean;
  /**
   * The envelope covers the page at first, so no section is the first screen: their images all
   * load lazily. Once the envelope is tapped, the first section's are on screen and load at once,
   * while it opens. Otherwise (the preview without the envelope) the first section loads eagerly.
   */
  behindEnvelope?: boolean;
}
