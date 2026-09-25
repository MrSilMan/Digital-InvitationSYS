import { expect, test } from '@playwright/test';

/**
 * Performance budget of a guest's first screen, checked on the production build (README →
 * Performance). Lighthouse scores move between runs; these facts do not, and they are what keeps
 * the scores up: little JavaScript before the first tap, the envelope's florals first, and
 * nothing behind the envelope rendered or downloaded until the guest opens it.
 */

const INVITATION = '/c/braulio-e-nanda/demo-familia-silva-001';

/** Compressed JavaScript at load, before any tap (about 160 KB when this was written). */
const JS_BUDGET_KB = 180;

/** Text that must never reach a guest's first screen, and why. */
const NOT_AT_LOAD = {
  // The browser SDK loads after the page (src/lib/sentry/browser.ts).
  'Sentry SDK': '__SENTRY__',
  // The dashboard's texts: the whole dictionary would be in the chunk (src/i18n/pt-AO/index.ts).
  'pt-AO dictionary': 'Registo de atividade',
  // The RSVP form loads as the guest nears it (src/features/invitation/rsvp/lazy-rsvp-form.tsx).
  'React Hook Form': 'useFormContext',
};

test.describe('performance budget', () => {
  test.skip(
    !process.env.E2E_BUILD && !process.env.E2E_BASE_URL,
    'Measures the production build: run with E2E_BUILD=1 after `npm run build`.',
  );

  test("the first screen stays light, and nothing behind the envelope loads before it's opened", async ({
    page,
  }) => {
    const scripts: { url: string; bytes: number; body: string }[] = [];
    const images: string[] = [];
    page.on('requestfinished', async (request) => {
      if (request.resourceType() === 'image') images.push(request.url());
      if (request.resourceType() !== 'script') return;
      const response = await request.response();
      const sizes = await request.sizes();
      scripts.push({
        url: request.url(),
        bytes: sizes.responseBodySize,
        body: (await response?.text().catch(() => '')) ?? '',
      });
    });

    await page.goto(INVITATION, { waitUntil: 'load' });
    // Anything that would still load on its own (idle work, lazy chunks) has time to start.
    await page.waitForTimeout(2_000);

    const totalKb = scripts.reduce((sum, script) => sum + script.bytes, 0) / 1024;
    expect(totalKb, `JavaScript at load: ${totalKb.toFixed(1)} KB`).toBeLessThan(JS_BUDGET_KB);
    for (const [what, marker] of Object.entries(NOT_AT_LOAD)) {
      const found = scripts.filter((script) => script.body.includes(marker)).map((s) => s.url);
      expect(found, `${what} loaded with the page`).toEqual([]);
    }

    // The envelope's florals are the largest paint: fetched ahead of everything else.
    const envelope = page.locator('[data-opening-screen]');
    await expect(envelope.locator('img[fetchpriority="high"]').first()).toBeAttached();

    // Behind the envelope: not rendered, and none of its pictures downloaded yet.
    const content = page.locator('main#convite');
    await expect(content).toHaveCSS('content-visibility', 'hidden');
    expect(images.filter((url) => url.includes('gallery') || url.includes('hero'))).toEqual([]);

    // Opened: rendered, and the first section's pictures load.
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    await expect(content).toHaveCSS('content-visibility', 'visible');
    await expect
      .poll(() => images.some((url) => url.includes('hero')), { timeout: 10_000 })
      .toBe(true);
  });
});
