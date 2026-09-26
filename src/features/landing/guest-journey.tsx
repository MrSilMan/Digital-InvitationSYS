import type { ReactNode } from 'react';

import { ThemeRoot } from '@/components/theme/theme-root';
import { CornerDecorations } from '@/components/ui/corner-decorations';
import { SectionTitle } from '@/components/ui/section-title';
import { landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { DEFAULT_THEME_ID, THEMES } from '@/themes';

import { PhoneFrame } from './decor';
import styles from './landing.module.css';
import { DEMO_GUEST } from './demo-event';
import { MiniEnvelope, MiniRsvpConfirmed, MiniWhatsappChat } from './mini-screens';
import { SECTION_ANCHORS } from './site-chrome';

const t = landing.journey;
const HEADING_ID = 'experiencia-titulo';

/**
 * "A experiência do convidado", on the default theme's paper: the WhatsApp message, the envelope
 * and the confirmed answer, each on a phone.
 */
export function GuestJourney({ date, linkText }: { date: Date; linkText: string }) {
  const theme = THEMES[DEFAULT_THEME_ID];
  const guestName = DEMO_GUEST.displayName;
  const screens: { caption: string; screen: ReactNode }[] = [
    {
      caption: t.chatCaption,
      screen: (
        <MiniWhatsappChat
          theme={theme}
          date={date}
          guestName={guestName}
          linkText={linkText}
          labels={{ time: t.chatTime, online: t.chatOnline, reply: t.chatReply }}
        />
      ),
    },
    {
      caption: t.envelopeCaption,
      screen: <MiniEnvelope theme={theme} guestName={guestName} sealId="selo-experiencia" />,
    },
    {
      caption: t.rsvpCaption,
      screen: (
        <MiniRsvpConfirmed
          theme={theme}
          guestName={guestName}
          seats={DEMO_GUEST.seatsAllowed}
          labels={{ dashboardTitle: t.dashboardTitle, dashboardNotice: t.dashboardNotice }}
        />
      ),
    },
  ];

  return (
    <section
      id={SECTION_ANCHORS.experience}
      aria-labelledby={HEADING_ID}
      className={cn(styles.deferred, 'scroll-mt-16')}
    >
      {/* Inside the deferred section: the theme's paper downloads only when it is near. */}
      <ThemeRoot
        theme={theme}
        container={false}
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28"
      >
        <CornerDecorations theme={theme} area="guestManual" />
        <div className="relative mx-auto max-w-6xl">
          <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
          <p className="mx-auto mt-5 max-w-2xl text-center font-body text-xl leading-relaxed text-ink">
            {t.intro}
          </p>
          <ol className="mt-14 grid gap-16 md:grid-cols-3 md:gap-8">
            {t.steps.map((step, index) => (
              <li key={step.title} className="flex flex-col items-center text-center">
                <div aria-hidden="true" className="w-[min(17rem,72vw)]">
                  <PhoneFrame>{screens[index]?.screen}</PhoneFrame>
                </div>
                <p className="sr-only">{screens[index]?.caption}</p>
                <h3 className="mt-8 flex items-center gap-3 font-caps text-2xl font-medium tracking-wide">
                  <span
                    aria-hidden="true"
                    className="grid size-9 place-items-center rounded-full bg-accent font-button text-base font-bold text-accent-contrast"
                  >
                    {index + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xs font-body text-lg leading-relaxed text-ink">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </ThemeRoot>
    </section>
  );
}
