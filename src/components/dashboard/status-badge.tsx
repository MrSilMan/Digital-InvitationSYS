import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

const TONES = {
  neutral: 'bg-stone-100 text-stone-700 ring-stone-200',
  good: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  bad: 'bg-red-50 text-red-700 ring-red-200',
  warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  dark: 'bg-stone-900 text-white ring-stone-900',
} as const;

/** A small rounded label: status, phase, role. `dot` marks a state (active, suspended…). */
export function StatusBadge({
  tone = 'neutral',
  dot = false,
  children,
}: {
  tone?: keyof typeof TONES;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
      )}
    >
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
