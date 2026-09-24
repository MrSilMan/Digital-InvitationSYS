import { expect, test } from '@playwright/test';

/** Demo links (npm run db:seed). */
const INVITATION = '/c/braulio-e-nanda/demo-familia-silva-001';
const SAVE_THE_DATE = '/c/braulio-e-nanda-save-the-date/demo-std-familia-silva1';
const CHAMPANHE = '/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01';

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

test.describe('Champanhe theme', () => {
  test('shows the invitation and its link preview in the theme', async ({ page, request }) => {
    await page.goto(CHAMPANHE);
    await expect(page.locator('[data-theme="champanhe"]')).toBeAttached();
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    const content = page.locator('main#convite');
    await expect(content.getByText('Família Silva', { exact: true })).toBeVisible();
    await expect(content.getByRole('link', { name: 'Google Maps' })).toHaveCount(2);

    const preview = await request.get(`${CHAMPANHE}/opengraph-image`);
    expect(preview.status()).toBe(200);
    expect(preview.headers()['content-type']).toBe('image/jpeg');
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
    // Through our link, which records the tap before forwarding to WhatsApp.
    await expect(groom).toHaveAttribute('href', `${SAVE_THE_DATE}/whatsapp/noivo`);
    await expect(groom).toHaveAttribute('target', '_blank');
  });
});

test.describe('RSVP', () => {
  // A demo guest without an answer in the seed (4 seats is Família Silva; Cassule has 3).
  const GUEST = '/c/braulio-e-nanda/demo-familia-cassule06';

  test('a guest confirms with the form, then changes the answer', async ({ page }) => {
    await page.goto(GUEST);
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    const content = page.locator('main#convite');

    // Earlier runs may have left an answer: start from the form either way.
    const change = content.getByRole('button', { name: 'Alterar a resposta' });
    if (await change.isVisible()) await change.click();

    await content.getByText('Sim, estarei presente').click();
    await content.getByLabel('Quantas pessoas vão?').selectOption('2');
    await content.getByLabel('Acompanhante 1').fill('Rui Cassule');
    await content.getByLabel('Mensagem para os noivos (opcional)').fill('Até lá!');
    await content.getByRole('button', { name: 'Enviar resposta' }).click();

    const summary = content.getByRole('status').filter({ hasText: 'confirmada' });
    await expect(summary).toContainText(
      'Obrigado, Família Cassule! A presença está confirmada para 2 pessoas.',
    );
    await expect(summary).toContainText('Rui Cassule');
    await expect(summary).toBeFocused();

    // Change it: cannot come after all.
    await content.getByRole('button', { name: 'Alterar a resposta' }).click();
    await content.getByText('Não poderei ir').click();
    await content.getByRole('button', { name: 'Enviar resposta' }).click();
    await expect(content.getByRole('status').filter({ hasText: 'avisar' })).toContainText(
      'Obrigado por nos avisar, Família Cassule.',
    );

    // Saved on the server: still there after a reload.
    await page.reload();
    await expect(content.getByText('Obrigado por nos avisar, Família Cassule.')).toBeAttached();
  });

  test('asks for an answer before sending', async ({ page }) => {
    await page.goto('/c/braulio-e-nanda/demo-familia-domingos9');
    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    const content = page.locator('main#convite');
    const change = content.getByRole('button', { name: 'Alterar a resposta' });
    if (await change.isVisible()) await change.click();
    await content.getByRole('button', { name: 'Enviar resposta' }).click();
    await expect(content.getByText('Indique se vai estar presente.')).toBeVisible();
  });

  test('the WhatsApp button goes through our link to wa.me', async ({ request }) => {
    const response = await request.get(`${INVITATION}/whatsapp/noiva`, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    const location = response.headers()['location'] ?? '';
    expect(location).toMatch(/^https:\/\/wa\.me\/244900000002\?text=/);
    expect(decodeURIComponent(location)).toContain('Sou Família Silva e confirmo');
  });
});
