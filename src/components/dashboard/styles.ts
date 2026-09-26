import { cn } from '@/lib/cn';

/**
 * Look of the signed-in areas (dashboard, admin, the login's fields): neutral stone tones and the
 * system font, independent of the invitation themes. Class helpers instead of components, so
 * Client Components can use them without pulling in anything else.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-400',
  secondary:
    'border border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50 disabled:text-stone-400',
  ghost: 'text-stone-700 hover:bg-stone-100 disabled:text-stone-400',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-red-300',
  /** The confirming button of a destructive step (a confirmation dialog). */
  destructive: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: 'md' | 'sm' | 'icon' = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-sans font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed',
    size === 'md' && 'min-h-11 px-4 text-sm',
    size === 'sm' && 'min-h-9 px-3 text-sm',
    size === 'icon' && 'size-9 shrink-0',
    BUTTON_VARIANTS[variant],
    className,
  );
}

export const inputClasses =
  'block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-sans text-base text-stone-900 shadow-xs placeholder:text-stone-400 focus:border-stone-600 focus:outline-2 focus:outline-offset-0 focus:outline-stone-900/15 disabled:bg-stone-100 disabled:text-stone-500 aria-[invalid=true]:border-red-600 sm:text-sm';

export const cardClasses = 'rounded-2xl border border-stone-200 bg-white shadow-xs';

/**
 * The night frame around the signed-in areas (the admin's sidebar, the dashboard's header): the
 * landing page's night and gold (`night`, `gold`, `ivory`, `mist` in app/globals.css).
 */
export const nightFrameClasses = 'bg-night bg-linear-to-b from-night-raised to-night text-mist';

/** Links and buttons on the night frame, with a gold focus ring. */
export const nightButtonClasses =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm text-mist transition-colors hover:bg-white/10 hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
