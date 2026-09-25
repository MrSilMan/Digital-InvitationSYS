import { expect, type Page, test } from '@playwright/test';
import sharp from 'sharp';

/** Demo login (npm run db:seed; passwords from SEED_* or the defaults). */
const COUPLE = {
  email: 'noivos@convites.test',
  password: process.env.SEED_COUPLE_PASSWORD || 'noivos-demo-2027',
};
/** The Champanhe copy of the demo wedding: the other specs read the Praia Rosa one. */
const GUEST_LINK = '/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01';

/** Signs in as the demo couple and opens the Champanhe event's editor. */
async function openChampanheEditor(page: Page): Promise<void> {
  await page.goto('/painel');
  await page.getByLabel('E-mail').fill(COUPLE.email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill(COUPLE.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  // The first login compiles the dashboard on a dev server: allow for it.
  await expect(page.getByRole('heading', { name: 'Os meus convites' })).toBeVisible({
    timeout: 30_000,
  });
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Tema Champanhe' })
    .getByRole('link', { name: 'Editar' })
    .click();
}

test.describe('couple dashboard', () => {
  test('sends visitors without a session to the login page', async ({ page }) => {
    await page.goto('/painel/eventos/00000000-0000-7000-8000-000000000000');
    await expect(page).toHaveURL(/\/entrar\?voltar=%2Fpainel%2Feventos%2F/);
    await expect(page.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
  });

  test('a couple edits the invitation, previews it, and guests see it once saved', async ({
    page,
    browser,
  }) => {
    await openChampanheEditor(page);
    await page.getByRole('tab', { name: 'Mensagem' }).click();
    const message = `Mensagem de teste ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Mensagem dos noivos' }).fill(message);
    await expect(page.getByRole('status').first()).toHaveText('Alterações por guardar');

    // On a phone the preview opens full screen; it shows the unsaved message.
    await page.getByRole('button', { name: 'Pré-visualizar' }).click();
    const preview = page.frameLocator('iframe[title="Pré-visualização do convite"]');
    await expect(preview.getByText(message)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Fechar' }).click();

    const guest = await browser.newPage();
    await guest.goto(GUEST_LINK);
    await expect(guest.getByText(message)).toHaveCount(0);

    await page.getByRole('button', { name: 'Guardar alterações' }).click();
    await expect(page.getByRole('status').first()).toHaveText(/Guardado às/);
    await guest.reload();
    await expect(guest.getByText(message)).toBeAttached();
  });

  test('a gallery photo goes through the worker to the guests, and can be removed', async ({
    page,
    browser,
  }) => {
    // A dev server compiles each route on first use, and the worker polls the queue.
    test.setTimeout(90_000);
    await openChampanheEditor(page);
    await page.getByRole('tab', { name: 'Multimédia' }).click();
    const panel = page.locator('#painel-media');

    const photo = await sharp({
      create: { width: 1200, height: 900, channels: 3, background: '#7a5c3e' },
    })
      .jpeg()
      .toBuffer();
    await panel
      .locator('input[data-media-input="GALLERY"]')
      .setInputFiles({ name: 'praia.jpg', mimeType: 'image/jpeg', buffer: photo });

    // Uploaded straight to storage, then processed by the worker: its thumbnail comes from /m/.
    const thumbnail = panel.locator('img[src^="/m/"]');
    await expect(thumbnail).toHaveCount(1, { timeout: 30_000 });
    const folder = (await thumbnail.getAttribute('src'))?.replace(/w\d+\.webp$/, '') ?? '';
    expect(folder).toMatch(/^\/m\/[0-9a-f-]+\/[0-9a-f-]+\/$/);

    const guest = await browser.newPage();
    await guest.goto(GUEST_LINK);
    await expect(guest.locator(`img[src^="${folder}"]`).first()).toBeAttached();

    page.once('dialog', (dialog) => void dialog.accept());
    await panel
      .getByRole('listitem')
      // `has` is matched inside each item: an unscoped locator.
      .filter({ has: page.locator('img[src^="/m/"]') })
      .getByRole('button', { name: /^Remover/ })
      .click();
    await expect(thumbnail).toHaveCount(0);
    await guest.reload();
    await expect(guest.locator(`img[src^="${folder}"]`)).toHaveCount(0);
  });
});
