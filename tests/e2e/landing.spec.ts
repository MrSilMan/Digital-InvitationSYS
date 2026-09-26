import { expect, test } from '@playwright/test';

/** The public landing page and the theme demos (no demo data needed). */

test.describe('landing page', () => {
  test('the examples take the names a visitor types', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /O vosso sim/ })).toBeVisible();

    await page.getByLabel('Noivo', { exact: true }).fill('Kiame');
    await page.getByLabel('Noiva', { exact: true }).fill('Luena');
    // Every example follows: the invitation cards, the WhatsApp message, the monograms.
    await expect(page.getByText('Kiame e Luena').first()).toBeVisible();
    await expect(page.getByText('Braúlio e Nanda')).toHaveCount(0);
    await expect(page.getByText('Kiame & Luena').first()).toBeAttached();

    // Emptied, a field shows the sample name again.
    await page.getByLabel('Noivo', { exact: true }).fill('');
    await expect(page.getByText('Braúlio e Luena').first()).toBeVisible();
  });

  test('sends couples to WhatsApp and to the login', async ({ page }) => {
    await page.goto('/');
    const create = page.getByRole('link', { name: /^Criar o nosso convite/ }).first();
    await expect(create).toHaveAttribute('href', /^https:\/\/wa\.me\/244\d{9}\?text=/);
    await expect(create).toHaveAttribute('target', '_blank');
    await expect(
      page.getByRole('link', { name: 'Quero este tema (Champanhe; abre o WhatsApp)' }),
    ).toHaveAttribute('href', /tema%20Champanhe/);

    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
  });

  test('the moving ribbon can be stopped', async ({ page }) => {
    await page.goto('/');
    const ribbon = page.getByRole('region', { name: 'O que cada convite traz' });
    const moving = ribbon.locator('ul').first().locator('..');
    await expect(moving).toHaveCSS('animation-play-state', 'running');
    await ribbon.getByRole('checkbox', { name: 'Parar a faixa em movimento' }).focus();
    await page.keyboard.press('Space');
    await expect(moving).toHaveCSS('animation-play-state', 'paused');
  });

  test('opens a theme demo, with its envelope, and comes back', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver demonstração do tema Champanhe' }).click();
    await expect(page).toHaveURL(/\/demonstracao\/champanhe$/);

    await page.getByRole('button', { name: 'Abrir o convite' }).click();
    const content = page.locator('main#convite');
    await expect(content.getByText('Família Silva', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Quero este tema/ })).toHaveAttribute(
      'href',
      /tema%20Champanhe/,
    );

    await page.getByRole('link', { name: 'Início' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /O vosso sim/ })).toBeVisible();
  });

  test('an unknown theme has no demo', async ({ page }) => {
    const response = await page.goto('/demonstracao/nao-existe');
    expect(response?.status()).toBe(404);
  });
});
