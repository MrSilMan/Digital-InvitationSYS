import { SectionTitle } from '@/components/ui/section-title';
import { invitation } from '@/i18n/pt-AO';

import { CopyButton } from '../copy-button';
import { SectionPage } from '../section-page';
import { fillTemplate } from '../text';

import type { SectionProps } from './types';

const HEADING_ID = 'secao-presentes';
const t = invitation.sections.gifts;

/** Optional "Lista de presentes": the couple's text and IBAN with a copy button. */
export function GiftsSection({ event, theme }: SectionProps) {
  const { text, iban, accountHolder } = event.gifts;
  return (
    <SectionPage theme={theme} area="gifts" labelledBy={HEADING_ID} contentClassName="gap-8">
      <SectionTitle id={HEADING_ID} icon="gift" script={t.script} caps={t.caps} />
      {text ? (
        <p className="max-w-88 font-body text-[clamp(1.25rem,5.8cqi,1.45rem)] leading-snug font-medium text-balance">
          {text}
        </p>
      ) : null}
      {iban ? (
        <>
          <div className="w-full max-w-88 rounded-2xl border border-accent/60 px-5 py-4">
            <p className="font-caps text-sm tracking-[0.2em] text-muted">{t.iban}</p>
            <p className="mt-1 font-body text-[clamp(0.95rem,4.4cqi,1.25rem)] font-medium wrap-break-word tabular-nums select-all">
              {iban}
            </p>
            {accountHolder ? (
              <p className="mt-2 font-caps text-base tracking-wider">
                {fillTemplate(t.accountHolder, { name: accountHolder })}
              </p>
            ) : null}
          </div>
          <CopyButton
            value={iban.replace(/\s+/g, '')}
            labels={{ copy: t.copy, copied: t.copied, failed: t.copyFailed }}
          />
        </>
      ) : null}
    </SectionPage>
  );
}
