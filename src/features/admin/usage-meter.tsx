import { cn } from '@/lib/cn';

/**
 * How much of the guest limit is used, as a thin bar: amber from 90%, red when full. Decorative:
 * the numbers are always written next to it.
 */
export function UsageMeter({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  // A sliver stays visible for the first guests.
  const width = value > 0 ? Math.max(ratio * 100, 3) : 0;
  return (
    <span
      aria-hidden="true"
      className={cn('block h-1.5 overflow-hidden rounded-full bg-stone-200', className)}
    >
      <span
        className={cn(
          'block h-full rounded-full',
          ratio >= 1 ? 'bg-red-600' : ratio >= 0.9 ? 'bg-amber-500' : 'bg-stone-700',
        )}
        style={{ width: `${width}%` }}
      />
    </span>
  );
}
