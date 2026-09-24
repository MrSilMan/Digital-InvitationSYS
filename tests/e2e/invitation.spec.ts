import { expect, test } from '@playwright/test';

/** Demo links (npm run db:seed). */
const INVITATION = '/c/braulio-e-nanda/demo-familia-silva-001';
const SAVE_THE_DATE = '/c/braulio-e-nanda-save-the-date/demo-std-familia-silva1';

test.describe('guest invitation', () => {
  test('opens the envelope and shows the personal invitation', async ({ page }) => {
    await page.goto(INVITATION);
    const content = page.locator('main#convite');

    const envelope = page.getByRole('button', { name: 'Abrir o convite' });
    await expect(envelope).toBeVisible();
    // The invitation behind the envelope is out of reach until it is opened.
    await expect(content).toHaveAttribute('inert', '');

    await envelope.click();
    await expect(envelope).toBeHidden();
    await expect(content).not.toHaveAttribute('inert', '');
    await expect(content.getByText('Família Silva', { exact: true })).toBeVisible();
    await expect(content.getByText('Convite válido para 4 pessoas')).toBeVisible();
    // Background music started by the tap, with a button to mute it.
    await expect(page.getByRole('button', { name: /(Des)?[Ll]igar a música/ })).toBeVisible();

    // A reload in the same tab goes straight to the invitation.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Abrir o convite' })).toBeHidden();
    await expect(content.getByText('Família Silva', { exact: true })).toBeVisible();
  });

  test('works with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(INVITATION);
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    const content = page.locator('main#convite');
    await expect(content.getByRole('heading', { name: 'Cronograma do dia' })).toBeAttached();
    await expect(content.getByText('Família Silva', { exact: true })).toBeVisible();
  });

  test('opens a photo in the full-screen gallery', async ({ page }) => {
    await page.goto(INVITATION);
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    await page.getByRole('button', { name: 'Ver a foto 2 em ecrã inteiro' }).click();
    const lightbox = page.getByRole('dialog', { name: 'Galeria de fotos' });
    await expect(lightbox).toBeVisible();
    await expect(lightbox.getByText('2 de 6')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();
  });

  test('offers the calendar file', async ({ request }) => {
    const response = await request.get(`${INVITATION}/calendario.ics`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/calendar');
    expect(await response.text()).toContain('SUMMARY:Casamento de Braúlio e Nanda');
  });

  test('shows "Convite não encontrado" for a bad link', async ({ page }) => {
    const response = await page.goto('/c/braulio-e-nanda/demo-nao-existe-0000000');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Convite não encontrado' })).toBeVisible();
  });
});

test.describe('Save the Date', () => {
  test('confirms through WhatsApp from the RSVP panel', async ({ page }) => {
    await page.goto(SAVE_THE_DATE);
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    await expect(page.getByRole('heading', { name: 'Save the date' })).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar presença' }).click();
    const panel = page.getByRole('dialog', { name: 'Confirmação de presença' });
    await expect(panel).toBeVisible();
    const groom = panel.getByRole('link', { name: 'Confirmar presença (noivo)' });
    await expect(groom).toHaveAttribute('href', /^https:\/\/wa\.me\/244900000001\?text=/);
    await expect(groom).toHaveAttribute('target', '_blank');
  });
});
