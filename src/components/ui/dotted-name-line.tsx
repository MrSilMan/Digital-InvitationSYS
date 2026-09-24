import { cn } from '@/lib/cn';

interface DottedNameLineProps {
  /** The guest's display name, e.g. "Família Silva" (shown in capitals). */
  name: string;
  className?: string;
}

/**
 * The personalization of the invitation card: the guest's name in bold serif capitals, centred on
 * a dotted accent line with a small open circle at each end.
 */
export function DottedNameLine({ name, className }: DottedNameLineProps) {
  return (
    <div className={cn('w-full', className)}>
      <p className="px-4 text-center font-caps text-[clamp(1.3rem,6.6cqi,2rem)] leading-tight font-bold tracking-[0.04em] text-balance text-ink uppercase">
        {name}
      </p>
      <div aria-hidden="true" className="mt-1 flex items-center">
        <span className="size-3 shrink-0 rounded-full border-2 border-accent" />
        <span className="h-0 flex-1 border-t-[3px] border-dotted border-accent" />
        <span className="size-3 shrink-0 rounded-full border-2 border-accent" />
      </div>
    </div>
  );
}
