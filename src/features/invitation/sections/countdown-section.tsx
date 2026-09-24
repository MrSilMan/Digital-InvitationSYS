import { DateLine } from '@/components/ui/date-line';
import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { CountdownTimer } from '../countdown/countdown-timer';
import { SectionPage } from '../section-page';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-contagem';
const t = invitation.sections.countdown;

export function CountdownSection({ event, theme, now }: SectionProps) {
  const startsAt = new Date(event.startsAt);
  return (
    <SectionPage theme={theme} area="countdown" labelledBy={HEADING_ID}>
      <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
      <CountdownTimer
        target={startsAt.getTime()}
        serverNow={now.getTime()}
        labels={{ units: t.units, untilTheDay: t.untilTheDay, after: t.after }}
      />
      <DateLine date={startsAt} withWeekday className="mt-2" />
    </SectionPage>
  );
}
