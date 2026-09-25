import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

const TONES = {
  neutral: 'bg-stone-100 text-stone-700',
  good: 'bg-emerald-50 text-emerald-800',
  bad: 'bg-red-50 text-red-700',
  dark: 'bg-stone-900 text-white',
} as const;

/** A small rounded label: status, phase, role. */
export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-sans text-xs font-medium',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
