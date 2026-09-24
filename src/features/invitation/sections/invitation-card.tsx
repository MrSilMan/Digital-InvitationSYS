import { DateLine } from '@/components/ui/date-line';
import { DottedNameLine } from '@/components/ui/dotted-name-line';
import { InfoBox } from '@/components/ui/info-box';
import { formatSeatsNote } from '@/i18n/plural';
import { invitation } from '@/i18n/pt-AO';

import { CoupleMark, HeroIllustration, SectionPage } from '../section-page';
import { coupleNames } from '../text';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-convite';

function Parents({ groom, bride }: { groom: string[]; bride: string[] }) {
  const column = (names: string[], align: string) => (
    <p className={align}>
      {names.map((name) => (
        <span key={name} className="block">
          {name}
        </span>
      ))}
    </p>
  );
  const className =
    'w-full font-caps text-[clamp(0.9rem,4.2cqi,1.15rem)] leading-snug tracking-[0.02em]';
  if (groom.length === 0 && bride.length === 0) return null;
  if (groom.length === 0 || bride.length === 0) {
    return <div className={className}>{column(groom.length ? groom : bride, 'text-center')}</div>;
  }
  return (
    <div className={`grid grid-cols-2 gap-x-5 ${className}`}>
      {column(groom, 'text-right')}
      {column(bride, 'text-left')}
    </div>
  );
}

/** The invitation card (reference "4 de 14"): the personalised page, with the guest's name. */
export function InvitationCardSection({ event, guest, theme }: SectionProps) {
  return (
    <SectionPage
      theme={theme}
      area="invitation"
      labelledBy={HEADING_ID}
      eager
      padded={false}
      contentClassName="gap-5 px-5 pt-16 pb-6"
      footer={<HeroIllustration theme={theme} image={event.hero} eager />}
    >
      <h2 id={HEADING_ID} className="sr-only">
        {invitation.sections.invitation.heading}
      </h2>
      <CoupleMark event={event} className="text-[clamp(4.5rem,22cqi,6rem)]" />
      <p className="font-caps text-[clamp(1.1rem,5.2cqi,1.4rem)] tracking-wider">
        {event.texts.introLine}
      </p>
      <Parents groom={event.groomParents} bride={event.brideParents} />
      <p className="font-caps text-[clamp(1.05rem,5cqi,1.3rem)] tracking-wider">
        {event.texts.invitationLine}
      </p>
      <DottedNameLine name={guest.displayName} />
      <p className="font-caps text-[clamp(0.95rem,4.4cqi,1.15rem)] tracking-[0.04em] text-balance">
        {event.texts.celebrationLine}
      </p>
      <p className="font-script text-[clamp(2.6rem,13cqi,3.8rem)] leading-tight text-balance text-script">
        {coupleNames(event)}
      </p>
      <DateLine date={new Date(event.startsAt)} withWeekday />
      <InfoBox>{formatSeatsNote(guest.seatsAllowed, event.texts.infoBoxText)}</InfoBox>
    </SectionPage>
  );
}
