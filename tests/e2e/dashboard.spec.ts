import { expect, type Page, test } from '@playwright/test';
import sharp from 'sharp';

/** Demo login (npm run db:seed; passwords from SEED_* or the defaults). */
const COUPLE = {
  email: 'noivos@convites.test',
  password: process.env.SEED_COUPLE_PASSWORD || 'noivos-demo-2027',
};
/** The Champanhe copy of the demo wedding: the other specs read the Praia Rosa one. */
const GUEST_LINK = '/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01';

/** Signs in as the demo couple and opens the Champanhe event (its overview, "Resumo"). */
async function openChampanheEvent(page: Page): Promise<void> {
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
    .getByRole('link', { name: /^Abrir/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Resumo', level: 1 })).toBeVisible({
    timeout: 30_000,
  });
}

/** A page of the event's menu (Resumo, Convidados, Editar convite). */
async function openEventPage(page: Page, name: string): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Páginas do convite' })
    .getByRole('link', { name })
    .click();
}

/** …and its editor. */
async function openChampanheEditor(page: Page): Promise<void> {
  await openChampanheEvent(page);
  await openEventPage(page, 'Editar convite');
  await expect(page.getByRole('heading', { name: 'Editar convite', level: 1 })).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('couple dashboard', () => {
  test('a couple adds a guest, sends the link by WhatsApp, and sees the answer', async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    await openChampanheEvent(page);
    await openEventPage(page, 'Convidados');
    await expect(page.getByRole('heading', { name: 'Convidados', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    const name = `Família Teste ${Date.now()}`;
    await page.getByRole('button', { name: 'Adicionar convidado' }).click();
    const add = page.getByRole('dialog', { name: 'Novo convidado' });
    await add.getByLabel('Nome no convite').fill(name);
    await add.getByLabel('Telemóvel (opcional)').fill('900 000 999');
    await add.getByLabel('Lugares').selectOption('2');
    await add.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(add).toBeHidden();

    await page.getByLabel('Procurar').fill(name);
    const row = page.getByRole('listitem').filter({ hasText: name });
    await expect(row).toContainText('Por enviar');

    // The WhatsApp message carries the personal link; opening WhatsApp marks it as sent.
    await page
      .context()
      .route('https://wa.me/**', (route) =>
        route.fulfill({ contentType: 'text/plain', body: 'WhatsApp' }),
      );
    await row.getByRole('button', { name: `Enviar pelo WhatsApp a ${name}` }).click();
    const whatsapp = page
      .getByRole('dialog', { name: `Enviar a ${name}` })
      .getByRole('link', { name: 'Abrir o WhatsApp' });
    const href = (await whatsapp.getAttribute('href')) ?? '';
    expect(href).toMatch(/^https:\/\/wa\.me\/244900000999\?text=/);
    const message = decodeURIComponent(href.slice(href.indexOf('?text=') + 6));
    const link = /https?:\/\/\S+\/c\/braulio-e-nanda-champanhe\/[\w-]{22}/.exec(message)?.[0];
    expect(link).toBeTruthy();
    const popup = page.waitForEvent('popup');
    await whatsapp.click();
    await (await popup).close();
    await expect(row).toContainText('Enviado a');

    // The guest opens their invitation and confirms.
    const guest = await browser.newPage();
    await guest.goto(new URL(link ?? '').pathname);
    await guest.getByRole('button', { name: 'Abrir o convite' }).click();
    const content = guest.locator('main#convite');
    await content.getByText('Sim, estarei presente').click();
    await content.getByLabel('Quantas pessoas vão?').selectOption('2');
    const note = `Contem connosco! ${Date.now()}`;
    await content.getByLabel('Mensagem para os noivos (opcional)').fill(note);
    await content.getByRole('button', { name: 'Enviar resposta' }).click();
    await expect(content.getByRole('status').filter({ hasText: 'confirmada' })).toContainText(name);

    // The couple sees the answer in the list and the message in the overview.
    await page.reload();
    await expect(row).toContainText('Confirmado · 2 pessoas');
    await openEventPage(page, 'Resumo');
    await expect(page.getByText(note)).toBeVisible({ timeout: 30_000 });
  });

  test('a couple imports guests from a CSV file, through the worker', async ({ page }) => {
    test.setTimeout(120_000);
    await openChampanheEvent(page);
    await openEventPage(page, 'Convidados');
    await expect(page.getByRole('heading', { name: 'Convidados', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    const run = Date.now();
    const csv = [
      'nome;telefone;lugares;grupo',
      `Primos ${run};900 000 777;3;Primos`,
      `Vizinha ${run};;;Vizinhos`,
      ';12345;0;',
    ].join('\r\n');
    await page.getByRole('button', { name: 'Importar lista (CSV)' }).click();
    const dialog = page.getByRole('dialog', { name: 'Importar convidados' });
    await dialog
      .getByLabel('Ficheiro CSV')
      .setInputFiles({ name: 'convidados.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await dialog.getByRole('button', { name: 'Importar', exact: true }).click();

    await expect(dialog.getByRole('status')).toContainText('2 convidado(s) importado(s).', {
      timeout: 30_000,
    });
    await expect(dialog.getByRole('status')).toContainText('1 linha(s) com erros');
    await expect(dialog.getByRole('cell', { name: '4', exact: true })).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Descarregar as linhas com erros (CSV)' }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Fechar' }).click();

    await page.getByLabel('Procurar').fill(String(run));
    await expect(page.getByRole('listitem').filter({ hasText: String(run) })).toHaveCount(2);
    await expect(page.getByRole('listitem').filter({ hasText: `Primos ${run}` })).toContainText(
      'Primos · 3 lugares',
    );
  });

  test('sends visitors without a session to the login page', async ({ page }) => {
    await page.goto('/painel/eventos/00000000-0000-7000-8000-000000000000');
    await expect(page).toHaveURL(/\/entrar\?voltar=%2Fpainel%2Feventos%2F/);
    await expect(page.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
  });

  test('a couple edits the invitation, previews it, and guests see it once saved', async ({
    page,
    browser,
  }) => {
    // A dev server compiles each page on first use.
    test.setTimeout(90_000);
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
