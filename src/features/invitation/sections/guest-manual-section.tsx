import { Icon } from '@/components/icons';
import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { SectionPage } from '../section-page';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-manual';
const t = invitation.sections.guestManual;

/** "Manual do bom convidado" (reference "9 de 14"): 2-column grid of icon + short rule. */
export function GuestManualSection({ event, theme }: SectionProps) {
  return (
    <SectionPage theme={theme} area="guestManual" labelledBy={HEADING_ID} contentClassName="gap-10">
      <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-8">
        {event.rules.map((rule) => (
          <li key={rule.text} className="flex flex-col items-center gap-2">
            <Icon name={rule.icon} size={64} stroke={1.1} className="text-accent" />
            <p className="max-w-40 font-body text-[clamp(1.15rem,5.4cqi,1.35rem)] leading-tight font-medium text-balance">
              {rule.text}
            </p>
          </li>
        ))}
      </ul>
    </SectionPage>
  );
}
