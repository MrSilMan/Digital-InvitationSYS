/**
 * The envelope is shown once per browser tab: after it is opened, a reload goes straight to the
 * invitation. An inline script (opening-boot-script.tsx) sets this attribute on <html> before the
 * first paint when the tab already opened this invitation, and CSS hides the envelope.
 */
export const OPENED_ATTRIBUTE = 'data-convite-aberto';

/** sessionStorage key, per event (never the guest token). */
export function openedStorageKey(eventSlug: string): string {
  return `convite-aberto:${eventSlug}`;
}
