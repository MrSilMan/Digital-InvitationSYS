import { expect, type Page, test } from '@playwright/test';

/** Demo admin login (npm run db:seed; password from SEED_ADMIN_PASSWORD or the default). */
const ADMIN = {
  email: 'admin@convites.test',
  password: process.env.SEED_ADMIN_PASSWORD || 'admin-demo-2027',
};

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test.describe('admin area', () => {
  test('an admin creates an event with a new couple account, deactivates it, and sees it in the log; the couple signs in; the admin deletes both', async ({
    page,
    browser,
  }) => {
    // A dev server compiles each page on first use.
    test.setTimeout(180_000);
    const run = Date.now();
    const email = `noivos-${run}@exemplo.ao`;

    // Admins land on the admin area.
    await signIn(page, ADMIN.email, ADMIN.password);
    await expect(page.getByRole('heading', { name: 'Eventos', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/admin$/);

    await page.getByRole('link', { name: 'Novo evento' }).click();
    await expect(page.getByRole('heading', { name: 'Novo evento', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel('Nova conta').check();
    await page.getByLabel('Nome', { exact: true }).fill(`Ana e João ${run}`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Nome do noivo').fill(`João ${run}`);
    await page.getByLabel('Nome da noiva').fill('Ana');
    await page.getByLabel('Data do casamento').fill('2027-06-12');
    // The guest links' address is suggested from the names.
    await expect(page.getByLabel('Endereço dos convites')).toHaveValue(`joao-${run}-e-ana`);
    await page.getByLabel('Limite de convidados').fill('60');
    await page.getByRole('button', { name: 'Criar evento' }).click();

    await expect(page.getByRole('heading', { name: 'Evento criado' })).toBeVisible({
      timeout: 30_000,
    });
    const password = (await page.getByTestId('temporary-password').textContent())?.trim() ?? '';
    expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);

    // Manage it: turn it off for the guests.
    await page.getByRole('link', { name: 'Gerir o evento' }).click();
    const couple = `João ${run} & Ana`;
    await expect(page.getByRole('heading', { name: couple, level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    const eventUrl = page.url();
    await page.getByRole('button', { name: 'Desativar evento' }).click();
    // It asks first; Cancelar is focused, so only a deliberate click confirms.
    const confirm = page.getByRole('dialog', { name: `Desativar o evento de ${couple}?` });
    await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Sim, desativar' }).click();
    // A Server Action, then the page refreshes from the server.
    await expect(page.getByRole('status').filter({ hasText: 'Evento desativado.' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Ativar evento' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Desativou o evento')).toBeVisible({ timeout: 15_000 });

    // The audit log has the whole story.
    await page
      .getByRole('navigation', { name: 'Secções da administração' })
      .getByRole('link', { name: 'Atividade' })
      .click();
    await expect(page.getByRole('heading', { name: 'Registo de atividade' })).toBeVisible({
      timeout: 30_000,
    });
    const entries = page.getByRole('listitem').filter({ hasText: couple });
    await expect(entries.filter({ hasText: 'Desativou o evento' })).toHaveCount(1);
    await expect(entries.filter({ hasText: 'Criou o evento' })).toHaveCount(1);
    await expect(
      page
        .getByRole('listitem')
        .filter({ hasText: 'Criou a conta' })
        .filter({ hasText: `Ana e João ${run}` }),
    ).toHaveCount(1);

    // The couple signs in with the temporary password and finds their event.
    const context = await browser.newContext();
    const couplePage = await context.newPage();
    await signIn(couplePage, email, password);
    await expect(couplePage.getByRole('heading', { name: 'Os meus convites' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(couplePage.getByRole('heading', { name: couple })).toBeVisible({
      timeout: 15_000,
    });

    // …and chooses a password of their own.
    await couplePage.getByRole('link', { name: 'A minha conta' }).click();
    await couplePage.getByLabel('Palavra-passe atual').fill(password);
    await couplePage.getByLabel('Nova palavra-passe', { exact: true }).fill(`a nossa festa ${run}`);
    await couplePage.getByLabel('Repita a nova palavra-passe').fill(`a nossa festa ${run}`);
    await couplePage.getByRole('button', { name: 'Alterar a palavra-passe' }).click();
    await expect(
      couplePage.getByRole('status').filter({ hasText: 'Palavra-passe alterada.' }),
    ).toBeVisible({ timeout: 30_000 });
    await context.close();

    // Finally the admin deletes what this test created, each confirmed by typing what identifies
    // it: the event (its address), then the account (its e-mail).
    await page.goto(eventUrl);
    await page.getByRole('button', { name: 'Eliminar evento' }).click();
    const eventDeletion = page.getByRole('dialog', { name: `Eliminar o evento de ${couple}?` });
    const forGood = eventDeletion.getByRole('button', { name: 'Eliminar para sempre' });
    await expect(forGood).toBeDisabled();
    await eventDeletion.getByLabel(/^Para confirmar/).fill(`joao-${run}-e-ana`);
    await forGood.click();
    await expect(page.getByRole('status').filter({ hasText: 'Evento eliminado.' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('link', { name: `Gerir o evento de ${couple}` })).toHaveCount(0);

    await page.goto(`/admin/contas?q=${encodeURIComponent(email)}`);
    await page.getByRole('link', { name: `Gerir a conta de Ana e João ${run}` }).click();
    await page.getByRole('button', { name: 'Eliminar conta' }).click();
    const accountDeletion = page.getByRole('dialog', {
      name: `Eliminar a conta de Ana e João ${run}?`,
    });
    await accountDeletion.getByLabel(/^Para confirmar/).fill(email);
    await accountDeletion.getByRole('button', { name: 'Eliminar para sempre' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Conta eliminada.' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('couples never see the admin area', async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(
      page,
      'noivos@convites.test',
      process.env.SEED_COUPLE_PASSWORD || 'noivos-demo-2027',
    );
    await expect(page.getByRole('heading', { name: 'Os meus convites' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('link', { name: 'Administração' })).toHaveCount(0);
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(404);
  });
});
