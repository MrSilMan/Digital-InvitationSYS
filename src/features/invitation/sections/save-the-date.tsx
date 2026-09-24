import { Icon } from '@/components/icons';
import { DateLine } from '@/components/ui/date-line';
import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { RsvpDialog } from '../rsvp-dialog';
import { CoupleMark, HeroIllustration, SectionPage } from '../section-page';

import { canConfirm, RsvpContent } from './rsvp-section';
import type { SectionProps } from './types';

const HEADING_ID = 'save-the-date';
const RSVP_HEADING_ID = 'save-the-date-confirmacao';
const t = invitation.saveTheDate;
const { buttons } = invitation;

/** The only page guests see before the invitation phase (reference "1 de 14"). */
export function SaveTheDatePage({ event, guest, theme, now }: SectionProps) {
  return (
    <SectionPage
      theme={theme}
      area="saveTheDate"
      labelledBy={HEADING_ID}
      eager
      contentClassName="gap-6 pt-16 pb-8"
      footer={<HeroIllustration theme={theme} image={event.hero} eager />}
    >
      <CoupleMark event={event} className="text-[clamp(4.5rem,22cqi,6rem)]" />
      <div>
        <h2
          id={HEADING_ID}
          className="font-caps text-[clamp(2.3rem,11.5cqi,3.1rem)] leading-none font-medium tracking-[0.02em] uppercase"
        >
          {t.title}
        </h2>
        <p className="mt-2 font-body text-[clamp(1.5rem,7cqi,1.9rem)] font-medium">{t.subtitle}</p>
      </div>
      <p className="flex items-center justify-center gap-[0.3em] font-script text-[clamp(2.6rem,13cqi,3.8rem)] leading-tight text-script">
        <span>{event.groomName}</span>
        <Icon name="rings" size="0.8em" stroke={1.25} className="shrink-0 text-accent" />
        <span className="sr-only"> e </span>
        <span>{event.brideName}</span>
      </p>
      <DateLine date={new Date(event.startsAt)} />
      {canConfirm(event) ? (
        <RsvpDialog
          label={
            <>
              {buttons.confirmAttendance.regular} <strong>{buttons.confirmAttendance.bold}</strong>
            </>
          }
          closeLabel={buttons.close}
          labelledBy={RSVP_HEADING_ID}
        >
          <SectionTitle
            id={RSVP_HEADING_ID}
            script={invitation.sections.rsvp.script}
            caps={invitation.sections.rsvp.caps}
          />
          <RsvpContent event={event} guest={guest} now={now} />
        </RsvpDialog>
      ) : null}
      <p className="font-body text-[clamp(1.15rem,5.4cqi,1.35rem)]">{t.officialInviteSoon}</p>
    </SectionPage>
  );
}
