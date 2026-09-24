import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './quote-box.module.css';

/** Solid "66"-style quotation mark; rotated 180° it becomes the closing "99". */
function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M14.6 47.2C6.2 47.2 0 41.1 0 32.5c0-13 9.8-26.4 25.4-32.5l2.2 4.3C18.7 9 13.6 15.6 12.9 22.4c.9-.3 1.9-.4 3-.4 7.6 0 13.4 5.4 13.4 12.6s-6 12.6-14.7 12.6zm34.7 0c-8.4 0-14.6-6.1-14.6-14.7 0-13 9.8-26.4 25.4-32.5l2.2 4.3c-8.9 4.7-14 11.3-14.7 18.1.9-.3 1.9-.4 3-.4 7.6 0 13.4 5.4 13.4 12.6s-6 12.6-14.7 12.6z"
      />
    </svg>
  );
}

interface QuoteBoxProps {
  children: ReactNode;
  /** Author line under the quote, e.g. the couple's names. */
  caption?: ReactNode;
  className?: string;
}

/**
 * The couple's message in a rounded box with a thin accent border and large solid quotation marks
 * breaking the border at the top-left and bottom-right corners.
 */
export function QuoteBox({ children, caption, className }: QuoteBoxProps) {
  return (
    <figure className={cn('relative mx-auto w-full max-w-md px-7 pt-12 pb-11', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[2.25rem] border-2 border-accent',
          styles.border,
        )}
      />
      <QuoteMark className="absolute -top-5 left-[1.6rem] h-10 w-[3.4rem] text-accent" />
      <QuoteMark className="absolute right-[1.6rem] -bottom-5 h-10 w-[3.4rem] rotate-180 text-accent" />
      <blockquote className="relative text-center font-body text-[1.35rem] leading-snug font-medium whitespace-pre-line text-ink">
        {children}
      </blockquote>
      {caption ? (
        <figcaption className="relative mt-5 text-center font-caps text-lg text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
