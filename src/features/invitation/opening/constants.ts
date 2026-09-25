/**
 * The envelope is shown once per browser tab: after it is opened, a reload goes straight to the
 * invitation. An inline script (opening-boot-script.tsx) sets this attribute on <html> before the
 * first paint when the tab already opened this invitation, and CSS hides the envelope.
 */
export const OPENED_ATTRIBUTE = 'data-convite-aberto';

/**
 * Marks the invitation behind a closed envelope: CSS skips rendering it (no layout, and no fonts
 * or lazy images downloaded for it) until the tab opened the invitation or the guest taps the
 * envelope, which sets REVEALED_ATTRIBUTE on it. See app/globals.css.
 */
export const BEHIND_ENVELOPE_ATTRIBUTE = 'data-behind-envelope';
export const REVEALED_ATTRIBUTE = 'data-revealed';

/** Marks the envelope button, for the early-tap listener of the boot script. */
export const ENVELOPE_ATTRIBUTE = 'data-opening-envelope';

/** Set on window by the boot script when the envelope was tapped before React was ready. */
export const EARLY_TAP_FLAG = '__conviteEarlyTap';

/** sessionStorage key, per event (never the guest token). */
export function openedStorageKey(eventSlug: string): string {
  return `convite-aberto:${eventSlug}`;
}
