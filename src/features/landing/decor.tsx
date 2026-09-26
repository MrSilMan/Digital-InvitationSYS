import type { CSSProperties, ReactNode } from 'react';

import { SEAL_PATH } from '@/features/invitation/opening/seal';
import { cn } from '@/lib/cn';

import styles from './landing.module.css';

/**
 * A phone around an example screen. Screens size everything in `--u`, 1% of the screen's width.
 * By default the screen is a size container and `--u` is `1cqi`. On the first screen, pass
 * `sizeContainer={false}` and set `--u` on a parent from the viewport instead (see
 * landing.module.css → .heroPhones): with size containers, every web font that arrives re-runs
 * style and layout for all of them, which delayed the hero by seconds on a slow phone.
 */
export function PhoneFrame({
  children,
  className,
  sizeContainer = true,
}: {
  children: ReactNode;
  className?: string;
  sizeContainer?: boolean;
}) {
  return (
    <div
      className={cn(
        // contain-strict: laid out apart from the page, so a web font arriving for the screen's
        // text re-runs layout for this phone only (and the page's own fonts never reach inside).
        'relative aspect-[9/19] w-full rounded-[14%/6.6%] bg-[#0b0e16] p-[3.2%] shadow-[0_40px_70px_-28px_rgb(0_0_0/0.6),inset_0_0_0_1.5px_rgb(255_255_255/0.12)] contain-strict',
        className,
      )}
    >
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-[11%/5.2%] bg-white',
          sizeContainer && '@container [--u:1cqi]',
        )}
      >
        {children}
        <span className="absolute top-[1.8%] left-1/2 h-[2.4%] w-[28%] -translate-x-1/2 rounded-full bg-[#0b0e16]" />
      </div>
    </div>
  );
}

/**
 * The envelope's wax seal (same outline and shading), in the colours of the theme around it
 * (`--theme-seal`, `--theme-seal-ink`). `gradientId` must be unique on the page. `className`
 * sizes and places it (e.g. `absolute …`): the seal itself is drawn in an inner box.
 */
export function WaxSeal({
  gradientId,
  className,
  children,
}: {
  gradientId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div
        className="relative grid aspect-square w-full place-items-center"
        style={{ color: 'var(--theme-seal-ink)' }}
      >
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="absolute inset-0 size-full drop-shadow-[0_8px_10px_rgb(0_0_0/0.35)]"
        >
          <defs>
            <radialGradient id={gradientId} cx="38%" cy="34%" r="70%">
              <stop offset="0%" style={{ stopColor: 'var(--theme-seal-ink)', stopOpacity: 0.55 }} />
              <stop offset="30%" style={{ stopColor: 'var(--theme-seal)' }} />
              <stop
                offset="100%"
                style={{ stopColor: 'color-mix(in srgb, var(--theme-seal) 70%, #000)' }}
              />
            </radialGradient>
          </defs>
          <path d={SEAL_PATH} fill={`url(#${gradientId})`} />
          <circle
            cx="50"
            cy="50"
            r="33"
            fill="none"
            strokeWidth="2.2"
            style={{ stroke: 'color-mix(in srgb, var(--theme-seal) 60%, #000)', opacity: 0.45 }}
          />
        </svg>
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

const PETAL_COLORS = [
  ['#f9cfdc', '#e58aae'],
  ['#f6e3ae', '#c99f55'],
  ['#fff6e8', '#eed6b6'],
] as const;

/** Deterministic petals (same on every render): spread across the width, never in step. */
const PETALS = Array.from({ length: 16 }, (_, index) => {
  const [c1, c2] = PETAL_COLORS[index % PETAL_COLORS.length] ?? PETAL_COLORS[0];
  const duration = 11 + ((index * 7) % 9);
  return {
    '--x': `${(index * 61) % 100}%`,
    '--size': `${10 + ((index * 5) % 11)}px`,
    '--duration': `${duration}s`,
    // Negative: every petal is already on its way when the page appears.
    '--delay': `${(-((index * 3.7) % duration)).toFixed(1)}s`,
    '--opacity': `${0.55 + ((index * 13) % 40) / 100}`,
    '--c1': c1,
    '--c2': c2,
  } as CSSProperties;
});

/** Rose petals falling through a night section (none with reduced motion). Decorative. */
export function Petals({ count = PETALS.length }: { count?: number }) {
  return (
    <div aria-hidden="true" className={styles.petals}>
      {PETALS.slice(0, count).map((style, index) => (
        <span key={index} className={styles.petal} style={style} />
      ))}
    </div>
  );
}

/** A twinkling four-point star. Decorative. */
export function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(styles.sparkle, 'absolute fill-current', className)}
      style={{ '--delay': `${delay}s` } as CSSProperties}
    >
      <path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" />
    </svg>
  );
}
