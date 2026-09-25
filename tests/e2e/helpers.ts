import type { Locator } from '@playwright/test';

/**
 * Scrolls to the RSVP section like a guest would. The form's code only loads as it nears the
 * screen (src/features/invitation/rsvp/lazy-rsvp-form.tsx), and its buttons stay disabled until
 * then: wait for them to be enabled before clicking the answer labels.
 */
export async function scrollToRsvp(content: Locator): Promise<void> {
  await content.locator('#secao-confirmacao').scrollIntoViewIfNeeded();
}
