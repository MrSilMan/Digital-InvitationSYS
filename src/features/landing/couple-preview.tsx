'use client';

import {
  createContext,
  useContext,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { Monogram } from '@/components/ui/monogram';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';

/**
 * "Experimentem com os vossos nomes": what a visitor types in the hero replaces the sample couple
 * in every example invitation on the landing page. The examples stay Server Components; only the
 * names and monograms inside them are these small client pieces. Nothing is stored or sent.
 */

interface Couple {
  groom: string;
  bride: string;
}

interface CouplePreviewState {
  /** What the examples show: the typed names, or the sample ones. */
  shown: Couple;
  typed: Couple;
  setTyped: (couple: Couple) => void;
  sample: Couple;
}

const CouplePreviewContext = createContext<CouplePreviewState | null>(null);

/** Longest name the examples take (the dashboard allows more; the phones are small). */
export const MAX_PREVIEW_NAME = 18;

export function CouplePreviewProvider({
  sample,
  children,
}: {
  sample: Couple;
  children: ReactNode;
}) {
  const [typed, setTyped] = useState<Couple>({ groom: '', bride: '' });
  const shown = {
    groom: typed.groom.trim() || sample.groom,
    bride: typed.bride.trim() || sample.bride,
  };
  return (
    <CouplePreviewContext value={{ shown, typed, setTyped, sample }}>
      {children}
    </CouplePreviewContext>
  );
}

function useCouplePreview(): CouplePreviewState {
  const state = useContext(CouplePreviewContext);
  if (!state) throw new Error('Live couple names need a CouplePreviewProvider.');
  return state;
}

/** The couple in a template: "{groom} e {bride}", "{groom} & {bride}"… */
export function LiveCouple({ template }: { template: string }) {
  const { shown } = useCouplePreview();
  return fillTemplate(template, { groom: shown.groom, bride: shown.bride });
}

export function LiveName({ who }: { who: keyof Couple }) {
  return useCouplePreview().shown[who];
}

/** The monogram of the names shown (their first letters). */
export function LiveMonogram({ className, style }: { className?: string; style?: CSSProperties }) {
  const { shown } = useCouplePreview();
  const initials = `${Array.from(shown.groom)[0] ?? ''}${Array.from(shown.bride)[0] ?? ''}`;
  return <Monogram initials={initials} className={className} style={style} />;
}

interface TryNamesProps {
  labels: { title: string; hint: string; groom: string; bride: string };
  className?: string;
}

/** The two name fields. */
export function TryNames({ labels, className }: TryNamesProps) {
  const { typed, setTyped, sample } = useCouplePreview();
  const id = useId();
  const hintId = `${id}-dica`;
  const field = (who: keyof Couple, label: string) => (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="font-button text-xs font-semibold tracking-[0.16em] text-muted uppercase">
        {label}
      </span>
      <input
        type="text"
        value={typed[who]}
        placeholder={sample[who]}
        maxLength={MAX_PREVIEW_NAME}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        aria-describedby={hintId}
        onChange={(event) => setTyped({ ...typed, [who]: event.target.value })}
        className="min-h-12 w-full min-w-0 rounded-full border border-white/25 bg-white/10 px-5 font-body text-lg text-ink placeholder:text-muted/70 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </label>
  );

  return (
    <fieldset
      className={cn(
        'w-full max-w-xl rounded-[1.75rem] border border-white/15 bg-white/6 p-5 sm:p-6',
        className,
      )}
    >
      <legend className="sr-only">{labels.title}</legend>
      <p aria-hidden="true" className="font-script text-4xl leading-tight text-script">
        {labels.title}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {field('groom', labels.groom)}
        {field('bride', labels.bride)}
      </div>
      <p id={hintId} className="mt-3 font-body text-base text-muted">
        {labels.hint}
      </p>
    </fieldset>
  );
}
