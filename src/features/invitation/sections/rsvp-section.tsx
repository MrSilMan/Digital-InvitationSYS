import { PillButton } from '@/components/ui/pill-button';
import { SectionTitle } from '@/components/ui/section-title';
import { formatDate } from '@/i18n/format';
import { invitation } from '@/i18n/pt-AO';

import { whatsappUrl } from '../links';
import { SectionPage } from '../section-page';
import { fillTemplate } from '../text';
import type { InvitationEvent, InvitationGuest } from '../types';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-confirmacao';
const t = invitation.sections.rsvp;

/** Whether the guest can confirm at all (a WhatsApp number now; the form joins in Phase 5). */
export function canConfirm(event: InvitationEvent): boolean {
  return event.rsvp.groomWhatsapp !== null || event.rsvp.brideWhatsapp !== null;
}

/**
 * How to confirm: the deadline, then the WhatsApp buttons with a pre-filled message. Shared by the
 * RSVP section and the Save the Date panel. Recording the taps and the form come in Phase 5.
 */
export function RsvpContent({
  event,
  guest,
  now,
}: {
  event: InvitationEvent;
  guest: InvitationGuest;
  now: Date;
}) {
  const deadline = event.rsvp.deadline ? new Date(event.rsvp.deadline) : null;
  const textClass =
    'max-w-88 font-body text-[clamp(1.2rem,5.6cqi,1.4rem)] leading-snug font-medium text-balance';

  if (deadline && now > deadline) {
    return <p className={textClass}>{fillTemplate(t.closed, { date: formatDate(deadline) })}</p>;
  }

  const message = fillTemplate(t.whatsappMessage, {
    guest: guest.displayName,
    groom: event.groomName,
    bride: event.brideName,
  });
  const buttons: { phone: string | null; label: string }[] = [
    { phone: event.rsvp.groomWhatsapp, label: t.groom },
    { phone: event.rsvp.brideWhatsapp, label: t.bride },
  ];
  const targets = buttons.filter(
    (target): target is { phone: string; label: string } => target.phone !== null,
  );

  return (
    <>
      {deadline ? (
        <p className={textClass}>{fillTemplate(t.deadline, { date: formatDate(deadline) })}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-6">
        {targets.map((target) => (
          <PillButton
            key={target.label}
            href={whatsappUrl(target.phone, message)}
            external
            icon="whatsapp"
            shape="circle"
          >
            {target.label}
          </PillButton>
        ))}
      </div>
    </>
  );
}

/** "Confirmação de presença": two round WhatsApp buttons, groom and bride. */
export function RsvpSection({ event, guest, theme, now }: SectionProps) {
  return (
    <SectionPage theme={theme} area="rsvp" labelledBy={HEADING_ID} contentClassName="gap-8">
      <SectionTitle id={HEADING_ID} icon="check-circle" script={t.script} caps={t.caps} />
      <RsvpContent event={event} guest={guest} now={now} />
    </SectionPage>
  );
}
