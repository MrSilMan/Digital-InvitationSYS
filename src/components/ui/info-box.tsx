import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** Thin rounded-border box for short notes, e.g. "Convite válido para 2 pessoas". */
export function InfoBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-sm rounded-2xl border border-ink/40 px-5 py-4 text-center font-caps text-lg tracking-[0.04em] text-ink',
        className,
      )}
    >
      {children}
    </div>
  );
}
