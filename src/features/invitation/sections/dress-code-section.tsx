import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { SectionPage } from '../section-page';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-traje';
const t = invitation.sections.dressCode;

/** Optional "Traje sugerido": the couple's text and colour swatches. */
export function DressCodeSection({ event, theme }: SectionProps) {
  const { text, colors } = event.dressCode;
  return (
    <SectionPage theme={theme} area="dressCode" labelledBy={HEADING_ID} contentClassName="gap-8">
      <SectionTitle id={HEADING_ID} icon="hanger" script={t.script} caps={t.caps} />
      {text ? (
        <p className="max-w-88 font-body text-[clamp(1.25rem,5.8cqi,1.45rem)] leading-snug font-medium text-balance">
          {text}
        </p>
      ) : null}
      {colors.length > 0 ? (
        <div className="flex flex-col items-center gap-3">
          {/* The swatches only illustrate the text above. */}
          <ul aria-hidden="true" className="flex flex-wrap justify-center gap-4">
            {colors.map((color) => (
              <li
                key={color}
                className="size-14 rounded-full border-4 border-white shadow-[0_6px_14px_-6px_rgb(0_0_0/0.45)]"
                style={{ backgroundColor: color }}
              />
            ))}
          </ul>
          <p className="font-caps text-base tracking-wider text-muted">{t.palette}</p>
        </div>
      ) : null}
    </SectionPage>
  );
}
