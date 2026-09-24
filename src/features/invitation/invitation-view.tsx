import type { ComponentType } from 'react';

import { ThemeRoot } from '@/components/theme/theme-root';
import { CornerDecorations } from '@/components/ui/corner-decorations';
import { invitation } from '@/i18n/pt-AO';
import type { SectionId } from '@/lib/validation/sections';
import type { ThemeDefinition } from '@/themes';

import { openedStorageKey } from './opening/constants';
import { OpeningBootScript } from './opening/opening-boot-script';
import { OpeningScreen } from './opening/opening-screen';
import { sectionsToShow } from './sections';
import { ClosingSection } from './sections/closing-section';
import { CountdownSection } from './sections/countdown-section';
import { DressCodeSection } from './sections/dress-code-section';
import { GallerySection } from './sections/gallery-section';
import { GiftsSection } from './sections/gifts-section';
import { GuestManualSection } from './sections/guest-manual-section';
import { InvitationCardSection } from './sections/invitation-card';
import { MessageSection } from './sections/message-section';
import { RsvpSection } from './sections/rsvp-section';
import { SaveTheDatePage } from './sections/save-the-date';
import { ScheduleSection } from './sections/schedule-section';
import type { SectionProps } from './sections/types';
import { coupleNames, fillTemplate } from './text';
import type { Invitation } from './types';

const SECTION_COMPONENTS: Record<SectionId, ComponentType<SectionProps>> = {
  invitation: InvitationCardSection,
  countdown: CountdownSection,
  message: MessageSection,
  gallery: GallerySection,
  schedule: ScheduleSection,
  dressCode: DressCodeSection,
  guestManual: GuestManualSection,
  gifts: GiftsSection,
  rsvp: RsvpSection,
  closing: ClosingSection,
};

const CONTENT_ID = 'convite';
const HEADING_ID = 'convite-titulo';

interface InvitationViewProps {
  invitation: Invitation;
  theme: ThemeDefinition;
  now: Date;
  /** "/c/<slug>/<token>" */
  basePath: string;
  /** CSP nonce of this request, for the inline opening script. */
  nonce?: string;
}

/**
 * The guest's invitation: the opening envelope, then either the Save the Date page or the
 * invitation sections in the couple's order, one full screen each (gentle scroll snap).
 */
export function InvitationView({
  invitation: data,
  theme,
  now,
  basePath,
  nonce,
}: InvitationViewProps) {
  const { event, guest } = data;
  const couple = coupleNames(event);
  const storageKey = openedStorageKey(event.slug);
  const props: SectionProps = { event, guest, theme, now, basePath };

  return (
    <ThemeRoot
      theme={theme}
      overrides={event.themeOverrides}
      container={false}
      className="invitation-root min-h-svh"
    >
      <OpeningBootScript nonce={nonce} storageKey={storageKey} />
      <OpeningScreen
        storageKey={storageKey}
        monogram={event.monogram}
        couple={couple}
        guestName={guest.displayName}
        music={event.music}
        decorations={<CornerDecorations theme={theme} area="opening" eager />}
        contentId={CONTENT_ID}
        headingId={HEADING_ID}
        labels={{ ...invitation.opening, ...invitation.music }}
      />
      <main id={CONTENT_ID} className="@container mx-auto w-full max-w-120">
        <h1 id={HEADING_ID} tabIndex={-1} className="sr-only">
          {fillTemplate(invitation.pageHeading, { couple })}
        </h1>
        {event.phase === 'SAVE_THE_DATE' ? (
          <SaveTheDatePage {...props} />
        ) : (
          sectionsToShow(event).map((id) => {
            const Section = SECTION_COMPONENTS[id];
            return <Section key={id} {...props} />;
          })
        )}
      </main>
    </ThemeRoot>
  );
}
