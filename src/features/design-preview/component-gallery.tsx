import Image from 'next/image';
import type { ReactNode } from 'react';

import { Icon, ICON_KEYS } from '@/components/icons';
import { ThemeRoot } from '@/components/theme/theme-root';
import { CornerDecorations } from '@/components/ui/corner-decorations';
import { DateLine } from '@/components/ui/date-line';
import { DottedNameLine } from '@/components/ui/dotted-name-line';
import { InfoBox } from '@/components/ui/info-box';
import { Monogram } from '@/components/ui/monogram';
import { PillButton } from '@/components/ui/pill-button';
import { QuoteBox } from '@/components/ui/quote-box';
import { SectionTitle } from '@/components/ui/section-title';
import { SerpentineTimeline } from '@/components/ui/serpentine-timeline';
import {
  formatInvitationDate,
  formatInvitationWeekdayTime,
  formatLongDate,
  formatTime,
} from '@/i18n/format';
import { formatSeatsNote } from '@/i18n/plural';
import { designPreview, invitation, invitationDefaults } from '@/i18n/pt-AO';
import type { ThemeArea, ThemeDefinition } from '@/themes';

import { SAMPLE } from './sample-content';

/** A phone-width, full-height page of the theme, with the theme's decorations for `area`. */
function Page({
  theme,
  area,
  children,
  eager = false,
}: {
  theme: ThemeDefinition;
  area: ThemeArea;
  children: ReactNode;
  eager?: boolean;
}) {
  return (
    <section className="relative flex min-h-[46rem] flex-col items-center gap-6 overflow-hidden px-6 py-20">
      <CornerDecorations theme={theme} area={area} eager={eager} />
      <div className="relative flex w-full flex-col items-center gap-6">{children}</div>
    </section>
  );
}

const { sections, buttons } = invitation;
const [locationBefore, locationAfter] = invitationDefaults.locationDescription.split('{venue}');

export function ComponentGallery({ theme }: { theme: ThemeDefinition }) {
  return (
    <section className="space-y-6">
      <h2 className="font-sans text-2xl font-bold text-slate-900">
        {designPreview.components.title}
      </h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <ThemeRoot
          theme={theme}
          className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[2rem] shadow-xl"
        >
          {/* Invitation card */}
          <section className="relative flex flex-col items-center overflow-hidden pt-16 text-center">
            <CornerDecorations theme={theme} area="invitation" eager />
            <div className="relative flex w-full flex-col items-center gap-5 px-6">
              <Monogram initials={SAMPLE.monogram} className="text-[5.5rem]" />
              <p className="font-caps text-xl tracking-wider">{invitationDefaults.introLine}</p>
              <div className="grid w-full grid-cols-2 gap-4 font-caps text-lg tracking-[0.04em]">
                <p className="text-right">
                  {SAMPLE.groomParents.map((name) => (
                    <span key={name} className="block">
                      {name}
                    </span>
                  ))}
                </p>
                <p className="text-left">
                  {SAMPLE.brideParents.map((name) => (
                    <span key={name} className="block">
                      {name}
                    </span>
                  ))}
                </p>
              </div>
              <p className="font-caps text-lg tracking-wider">
                {invitationDefaults.invitationLine}
              </p>
              <DottedNameLine name={SAMPLE.guestName} />
              <p className="font-caps text-base tracking-[0.04em]">
                {invitationDefaults.celebrationLine}
              </p>
              <p className="font-script text-[3.6rem] leading-tight text-script">
                {SAMPLE.groomName} e {SAMPLE.brideName}
              </p>
              <DateLine date={SAMPLE.startsAt} withWeekday />
              <InfoBox>{formatSeatsNote(SAMPLE.seats)}</InfoBox>
            </div>
            <Image
              src={theme.hero.src}
              width={theme.hero.width}
              height={theme.hero.height}
              alt=""
              sizes="430px"
              className="relative mt-4 h-auto w-full"
            />
          </section>

          <Page theme={theme} area="message">
            <SectionTitle script={sections.message.script} caps={sections.message.caps} />
            <QuoteBox>{SAMPLE.message}</QuoteBox>
          </Page>

          <Page theme={theme} area="schedule">
            <SectionTitle
              script={sections.schedule.script}
              caps={sections.schedule.caps}
              capsAlign="end"
            />
            <p className="font-caps text-xl font-bold tracking-wider text-accent">
              {SAMPLE.location.heading}
            </p>
            <p className="text-center font-caps text-lg tracking-[0.04em] text-balance">
              {locationBefore}
              <strong>{SAMPLE.location.venue}</strong>
              {locationAfter?.replace('{time}', SAMPLE.location.time)}
            </p>
            <PillButton
              href={SAMPLE.location.mapsUrl}
              external
              icon="map-pin"
              shape={theme.buttonShape}
            >
              <strong>{buttons.googleMaps.bold}</strong> {buttons.googleMaps.regular}
            </PillButton>
            <a
              href={SAMPLE.location.wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-caps text-base text-muted underline underline-offset-4"
            >
              <Icon name="waze" size={20} />
              {buttons.waze}
            </a>
            <SerpentineTimeline items={SAMPLE.timeline} className="mt-8 w-full" />
          </Page>

          <Page theme={theme} area="guestManual">
            <SectionTitle script={sections.guestManual.script} caps={sections.guestManual.caps} />
            <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-8">
              {SAMPLE.rules.map((rule) => (
                <li key={rule.text} className="flex flex-col items-center gap-2 text-center">
                  <Icon name={rule.icon} size={64} stroke={1.1} className="text-accent" />
                  <p className="font-body text-xl leading-tight font-medium text-balance">
                    {rule.text}
                  </p>
                </li>
              ))}
            </ul>
          </Page>

          <Page theme={theme} area="rsvp">
            <SectionTitle icon="camera" script={sections.gallery.script} />
            <p className="-mt-3 max-w-[16rem] text-center font-caps text-xl tracking-wider">
              {sections.gallery.subtitle}
            </p>
            <PillButton icon="check-circle" shape={theme.buttonShape}>
              {buttons.confirmAttendance.regular} <strong>{buttons.confirmAttendance.bold}</strong>
            </PillButton>
            <PillButton icon="whatsapp" shape="circle">
              {buttons.confirmAttendance.regular} {buttons.confirmAttendance.bold}
            </PillButton>
            <DottedNameLine name={SAMPLE.longGuestName} />
          </Page>
        </ThemeRoot>

        <div className="space-y-8">
          <ThemeRoot theme={theme} className="rounded-3xl p-6 shadow-md">
            <p className="mb-4 font-sans text-sm font-semibold text-slate-700">
              {designPreview.timelineNarrow}
            </p>
            <div className="mx-auto w-[320px]">
              <SerpentineTimeline items={SAMPLE.timeline.slice(0, 5)} />
            </div>
          </ThemeRoot>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 font-sans text-lg font-semibold text-slate-800">
              {designPreview.dates.title}
            </h3>
            <ul className="space-y-1 font-mono text-sm text-slate-800">
              <li>{formatInvitationDate(SAMPLE.startsAt)}</li>
              <li>{formatInvitationWeekdayTime(SAMPLE.startsAt)}</li>
              <li>{formatTime(SAMPLE.startsAt)}</li>
              <li>{formatLongDate(SAMPLE.startsAt)}</li>
            </ul>
          </section>

          <ThemeRoot theme={theme} className="rounded-3xl p-6 shadow-md">
            <h3 className="mb-4 font-sans text-lg font-semibold text-slate-800">
              {designPreview.icons.title}
            </h3>
            <ul className="grid grid-cols-4 gap-4 sm:grid-cols-6">
              {ICON_KEYS.map((key) => (
                <li key={key} className="flex flex-col items-center gap-1 text-center">
                  <Icon name={key} size={40} stroke={1.25} className="text-accent" />
                  <span className="font-mono text-[0.65rem] text-slate-600">{key}</span>
                </li>
              ))}
            </ul>
          </ThemeRoot>
        </div>
      </div>
    </section>
  );
}
