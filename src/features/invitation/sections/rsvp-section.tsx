import { PillButton } from '@/components/ui/pill-button';
import { SectionTitle } from '@/components/ui/section-title';
import { formatDate } from '@/i18n/format';
import { editor, invitation } from '@/i18n/pt-AO';

import { LazyRsvpForm } from '../rsvp/lazy-rsvp-form';
import { acceptsForm, acceptsWhatsapp, rsvpClosed } from '../rsvp/rules';
import { SectionPage } from '../section-page';
import { fillTemplate } from '../text';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-confirmacao';
const t = invitation.sections.rsvp;

type RsvpContentProps = Pick<
  SectionProps,
  'event' | 'guest' | 'rsvp' | 'now' | 'guestToken' | 'basePath' | 'preview'
>;

/**
 * How to confirm, per the event's mode: the deadline, the form (FORM, BOTH) and the WhatsApp
 * buttons (WHATSAPP, BOTH). Shared by the RSVP section and the Save the Date panel. The buttons go
 * through /whatsapp/<noivo|noiva>, which records the tap and forwards to WhatsApp.
 */
export function RsvpContent({
  event,
  guest,
  rsvp,
  now,
  guestToken,
  basePath,
  preview = false,
}: RsvpContentProps) {
  const deadline = event.rsvp.deadline ? new Date(event.rsvp.deadline) : null;
  const closed = rsvpClosed(event, now);
  const withForm = acceptsForm(event);
  const answeredWithForm = withForm && rsvp !== null && rsvp.attending !== null;
  // After a form answer, WhatsApp is no longer offered as another way to confirm.
  const withWhatsapp = acceptsWhatsapp(event) && !closed && !answeredWithForm;
  const textClass =
    'max-w-88 font-body text-[clamp(1.2rem,5.6cqi,1.4rem)] leading-snug font-medium text-balance';

  const buttons = [
    { phone: event.rsvp.groomWhatsapp, label: t.groom, target: 'noivo' },
    { phone: event.rsvp.brideWhatsapp, label: t.bride, target: 'noiva' },
  ].filter((button) => button.phone !== null);

  return (
    <>
      {deadline ? (
        <p className={textClass}>
          {fillTemplate(closed ? t.closed : t.deadline, { date: formatDate(deadline) })}
        </p>
      ) : null}
      {withForm ? (
        <LazyRsvpForm
          eventSlug={event.slug}
          guestToken={guestToken}
          guestName={guest.displayName}
          seatsAllowed={guest.seatsAllowed}
          initial={rsvp}
          closed={closed}
          labels={{ ...t.form, peopleForms: invitation.people }}
          previewNotice={preview ? editor.preview.inertNotice : undefined}
        />
      ) : null}
      {withWhatsapp ? (
        <div className="flex flex-col items-center gap-4">
          {withForm ? (
            <p className="font-caps text-[clamp(1rem,4.6cqi,1.2rem)] tracking-wider">
              {t.orWhatsapp}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-6">
            {buttons.map((button) =>
              preview ? (
                <PillButton key={button.target} icon="whatsapp" shape="circle">
                  {button.label}
                </PillButton>
              ) : (
                <PillButton
                  key={button.target}
                  href={`${basePath}/whatsapp/${button.target}`}
                  external
                  icon="whatsapp"
                  shape="circle"
                >
                  {button.label}
                </PillButton>
              ),
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** "Confirmação de presença": the form and/or the two round WhatsApp buttons. */
export function RsvpSection(props: SectionProps) {
  return (
    <SectionPage theme={props.theme} area="rsvp" labelledBy={HEADING_ID} contentClassName="gap-8">
      <SectionTitle id={HEADING_ID} icon="check-circle" script={t.script} caps={t.caps} />
      <RsvpContent {...props} />
    </SectionPage>
  );
}
