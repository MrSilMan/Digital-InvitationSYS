import { cn } from '@/lib/cn';

/**
 * Classes of the accent call-to-action buttons, in their own module so Client Components can style
 * a button like PillButton without bundling next/link and the whole icon set.
 */

export type PillShape = 'pill' | 'circle';

const SHAPES = {
  pill: 'min-h-14 gap-3 rounded-full px-8 py-3 text-[1.05rem]',
  circle: 'size-32 flex-col gap-1.5 rounded-full p-4 text-center text-[0.8rem] leading-tight',
} as const satisfies Record<PillShape, string>;

export function pillButtonClasses(shape: PillShape = 'pill', className?: string): string {
  return cn(
    'inline-flex items-center justify-center bg-accent font-button tracking-[0.06em] text-accent-contrast uppercase shadow-[0_8px_18px_-10px_rgb(0_0_0/0.55)] transition-[filter] hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60 [&_strong]:font-bold',
    SHAPES[shape],
    className,
  );
}

/** Icon size inside each shape. */
export const PILL_ICON_SIZE: Record<PillShape, number> = { pill: 28, circle: 34 };
