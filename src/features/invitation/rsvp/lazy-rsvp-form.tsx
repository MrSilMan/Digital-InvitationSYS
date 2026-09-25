'use client';

import { type ComponentProps, lazy, Suspense, useEffect, useRef } from 'react';

import type { RsvpForm as RsvpFormComponent } from './rsvp-form';

/**
 * The RSVP form, whose code loads as the guest nears it. The server renders the form as usual;
 * in the browser, its code (React Hook Form and the validation, a large share of the page's
 * JavaScript) is only downloaded once the form comes within about two screens, its dialog opens,
 * or the guest presses a key. Until then React keeps showing the server's HTML. (`next/dynamic` would download it
 * with the page: Next.js preloads what it rendered on the server.)
 */

let reveal: (() => void) | undefined;
// On the server, the form renders right away.
const nearby =
  typeof window === 'undefined'
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        reveal = resolve;
      });

const RsvpForm = lazy(() =>
  nearby.then(() => import('./rsvp-form')).then((module) => ({ default: module.RsvpForm })),
);

/** Start loading while the form is still about two screens away. */
const ROOT_MARGIN = '200% 0px';

interface LazyRsvpFormProps extends ComponentProps<typeof RsvpFormComponent> {
  /**
   * Load right away. For pages that re-render (the dashboard's live preview refreshes on every
   * change): React holds a refresh until everything in it has rendered, so a form still waiting
   * to come near the screen would hold every refresh forever.
   */
  loadNow?: boolean;
}

export function LazyRsvpForm({ loadNow = false, ...props }: LazyRsvpFormProps) {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = marker.current;
    if (!element || !reveal) return;
    const show = reveal;
    if (loadNow) {
      show();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) load();
      },
      { rootMargin: ROOT_MARGIN },
    );
    function stop() {
      observer.disconnect();
      window.removeEventListener('keydown', load);
    }
    function load() {
      stop();
      show();
    }
    observer.observe(element);
    // Keyboard users move by Tab, faster than the page scrolls: while the form's code is missing
    // its controls are disabled, and Tab would skip the whole form. Their first key loads it.
    window.addEventListener('keydown', load);
    return stop;
  }, [loadNow]);

  return (
    <>
      {/* Where the form starts. Absolutely positioned: no gap or size in the surrounding layout. */}
      <span ref={marker} aria-hidden="true" className="pointer-events-none absolute size-px" />
      <Suspense fallback={null}>
        <RsvpForm {...props} />
      </Suspense>
    </>
  );
}
