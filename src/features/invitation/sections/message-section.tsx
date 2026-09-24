import { QuoteBox } from '@/components/ui/quote-box';
import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { SectionPage } from '../section-page';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-mensagem';
const t = invitation.sections.message;

/** "Mensagem dos noivos" (reference "7 de 14"). */
export function MessageSection({ event, theme }: SectionProps) {
  return (
    <SectionPage theme={theme} area="message" labelledBy={HEADING_ID} contentClassName="gap-10">
      <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
      <QuoteBox>{event.coupleMessage}</QuoteBox>
    </SectionPage>
  );
}
