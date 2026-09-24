import { DateLine } from '@/components/ui/date-line';
import { PillButton } from '@/components/ui/pill-button';
import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { calendarEventFor, googleCalendarUrl } from '../calendar';
import { SectionPage } from '../section-page';
import { coupleNames } from '../text';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-encerramento';
const t = invitation.sections.closing;

/** "Obrigado": the couple's names and "Adicionar ao calendário" (.ics file + Google Calendar). */
export function ClosingSection({ event, theme, basePath }: SectionProps) {
  return (
    <SectionPage theme={theme} area="closing" labelledBy={HEADING_ID} contentClassName="gap-7">
      <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
      <p className="max-w-88 font-body text-[clamp(1.25rem,5.8cqi,1.45rem)] leading-snug font-medium text-balance">
        {t.message}
      </p>
      <p className="font-script text-[clamp(3rem,15cqi,4rem)] leading-tight text-script">
        {coupleNames(event)}
      </p>
      <DateLine date={new Date(event.startsAt)} />
      <PillButton
        href={`${basePath}/calendario.ics`}
        download={`casamento-${event.slug}.ics`}
        icon="calendar-plus"
      >
        {t.addToCalendar.regular} <strong>{t.addToCalendar.bold}</strong>
      </PillButton>
      <a
        href={googleCalendarUrl(calendarEventFor(event))}
        target="_blank"
        rel="noopener noreferrer"
        className="font-caps text-base text-muted underline underline-offset-4"
      >
        {t.googleCalendar}
      </a>
    </SectionPage>
  );
}
