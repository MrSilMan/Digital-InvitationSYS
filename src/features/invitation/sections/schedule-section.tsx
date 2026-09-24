import type { ReactNode } from 'react';

import { Icon } from '@/components/icons';
import { PillButton } from '@/components/ui/pill-button';
import { SectionTitle } from '@/components/ui/section-title';
import { SerpentineTimeline } from '@/components/ui/serpentine-timeline';
import { formatTime } from '@/i18n/format';
import { invitation, invitationDefaults } from '@/i18n/pt-AO';
import type { ThemeDefinition } from '@/themes';

import { googleMapsUrl, wazeUrl } from '../links';
import { SectionPage } from '../section-page';
import type { InvitationLocation } from '../types';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-cronograma';
const t = invitation.sections.schedule;
const { buttons } = invitation;

/** "Terão lugar na **Praia do Bispo**, às 16h00." — {venue} in bold, {time} filled in. */
function locationSentence(location: InvitationLocation): ReactNode[] {
  const template = location.description ?? invitationDefaults.locationDescription;
  const filled = template.replaceAll('{time}', formatTime(new Date(location.startsAt)));
  return filled
    .split('{venue}')
    .flatMap((part, index) =>
      index === 0 ? [part] : [<strong key={index}>{location.venueName}</strong>, part],
    );
}

function Location({
  location,
  shape,
}: {
  location: InvitationLocation;
  shape: ThemeDefinition['buttonShape'];
}) {
  const waze = wazeUrl(location);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h3 className="font-caps text-[clamp(1.2rem,5.8cqi,1.5rem)] font-bold tracking-wider text-accent">
        {location.heading}
      </h3>
      <p className="max-w-88 font-caps text-[clamp(0.95rem,4.4cqi,1.2rem)] tracking-[0.04em] text-balance">
        {locationSentence(location)}
      </p>
      <PillButton href={googleMapsUrl(location)} external icon="map-pin" shape={shape}>
        <strong>{buttons.googleMaps.bold}</strong> {buttons.googleMaps.regular}
      </PillButton>
      {waze ? (
        <a
          href={waze}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-caps text-base text-muted underline underline-offset-4"
        >
          <Icon name="waze" size={20} />
          {buttons.waze}
        </a>
      ) : null}
    </div>
  );
}

/** "Cronograma do dia" (reference "5 de 14"): the venues, then the serpentine timeline. */
export function ScheduleSection({ event, theme }: SectionProps) {
  const timeline = event.timeline.map((item) => ({
    label: item.label,
    time: item.startsAt ? formatTime(new Date(item.startsAt)) : null,
    icon: item.icon,
  }));
  return (
    <SectionPage theme={theme} area="schedule" labelledBy={HEADING_ID} contentClassName="gap-8">
      <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} capsAlign="end" />
      {event.locations.map((location) => (
        <Location
          key={`${location.heading}-${location.startsAt}`}
          location={location}
          shape={theme.buttonShape}
        />
      ))}
      {timeline.length > 0 ? <SerpentineTimeline items={timeline} className="mt-4 w-full" /> : null}
    </SectionPage>
  );
}
