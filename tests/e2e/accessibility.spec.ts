import { AxeBuilder } from '@axe-core/playwright';
import { type Browser, expect, type Page, test, type TestInfo } from '@playwright/test';

import { scrollToRsvp } from './helpers';

/**
 * Automated accessibility checks (axe-core, WCAG 2.2 A and AA rules) of every main page and
 * state: guest pages, the login, the couple dashboard and the admin area. axe finds the
 * mechanical problems (names, labels, roles, contrast, structure); keyboard use and screen
 * reader wording are checked by hand (README → Accessibility).
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** A dev server compiles each page on its first visit: allow for it after navigating. */
const NAVIGATION = { timeout: 30_000 };

/** Demo data (npm run db:seed). */
const INVITATION = '/c/braulio-e-nanda/demo-familia-silva-001';
const SAVE_THE_DATE = '/c/braulio-e-nanda-save-the-date/demo-std-familia-silva1';
const CHAMPANHE = '/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01';
const COUPLE = {
  email: 'noivos@convites.test',
  password: process.env.SEED_COUPLE_PASSWORD || 'noivos-demo-2027',
};
const ADMIN = {
  email: 'admin@convites.test',
  password: process.env.SEED_ADMIN_PASSWORD || 'admin-demo-2027',
};

/** Fails with a readable list: rule, impact, what it means, and the first elements it found. */
async function expectAccessible(page: Page, state: string): Promise<void> {
  // Next.js streams the <title> after the page's first HTML: check once it is there.
  await expect(page).toHaveTitle(/\S/);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const found = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n    ` +
      violation.nodes
        .slice(0, 5)
        .map((node) => {
          // e.g. "Element has insufficient color contrast of 4.1 (foreground …)".
          const why = node.failureSummary?.split('\n').find((line) => /^\s+\S/.test(line));
          return `${node.target.join(' ')}: ${node.html.slice(0, 120)}${why ? `\n      ${why.trim()}` : ''}`;
        })
        .join('\n    '),
  );
  expect(found, `${state}: accessibility problems`).toEqual([]);
}

async function openEnvelope(page: Page): Promise<void> {
  const envelope = page.getByRole('button', { name: 'Abrir o convite' });
  await envelope.click();
  await expect(envelope).toBeHidden();
}

/** A page shared by a serial group (one login), with the project's phone settings (axe needs a context of its own). */
async function sharedPage(browser: Browser, testInfo: TestInfo): Promise<Page> {
  const context = await browser.newContext(testInfo.project.use);
  return context.newPage();
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test.describe('accessibility: guest pages', () => {
  test('the envelope, then the whole invitation with its RSVP form', async ({ page }) => {
    await page.goto(INVITATION);
    await expectAccessible(page, 'closed envelope');

    await openEnvelope(page);
    // The form's code loads as the guest nears it: check it once it is ready. This guest has an
    // answer in the seed: "Alterar a resposta" shows the form (nothing is sent).
    const content = page.locator('main#convite');
    await scrollToRsvp(content);
    const change = content.getByRole('button', { name: 'Alterar a resposta' });
    if (await change.isVisible()) await change.click();
    await expect(content.getByRole('button', { name: 'Enviar resposta' })).toBeEnabled();
    await expectAccessible(page, 'open invitation');
  });

  test('the full-screen gallery', async ({ page }) => {
    await page.goto(INVITATION);
    await openEnvelope(page);
    await page.getByRole('button', { name: 'Ver a foto 2 em ecrã inteiro' }).click();
    await expect(page.getByRole('dialog', { name: 'Galeria de fotos' })).toBeVisible();
    await expectAccessible(page, 'lightbox');
  });

  test('the Champanhe theme', async ({ page }) => {
    await page.goto(CHAMPANHE);
    await openEnvelope(page);
    await expectAccessible(page, 'Champanhe invitation');
  });

  test('the Save the Date and its RSVP panel', async ({ page }) => {
    await page.goto(SAVE_THE_DATE);
    await openEnvelope(page);
    await expectAccessible(page, 'Save the Date');
    await page.getByRole('button', { name: /Confirmar presença/i }).click();
    await expect(page.getByRole('dialog', { name: 'Confirmação de presença' })).toBeVisible();
    await expectAccessible(page, 'Save the Date RSVP panel');
  });

  test('a link that does not exist', async ({ page }) => {
    await page.goto('/c/braulio-e-nanda/demo-nao-existe-0000000');
    await expectAccessible(page, 'invitation not found');
  });

  test('the login page', async ({ page }) => {
    await page.goto('/entrar');
    await expectAccessible(page, 'login');
  });

  test('the landing page, with an answer open', async ({ page }) => {
    await page.goto('/');
    await expectAccessible(page, 'landing page');
    await page.getByText('Quanto custa?').click();
    await expect(page.getByText(/^Depende do número de convidados/)).toBeVisible();
    await expectAccessible(page, 'landing page, answer open');
  });

  test('a theme demo', async ({ page }) => {
    await page.goto('/demonstracao/praia-rosa');
    await expectAccessible(page, 'theme demo, envelope');
    await openEnvelope(page);
    await expectAccessible(page, 'theme demo, invitation');
  });

  test('the landing page works with the keyboard alone', async ({ page }) => {
    await page.goto('/');
    // The skip link comes first and moves focus to the content.
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar para o conteúdo' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#conteudo')).toBeFocused();

    // The name fields are reached in order, and a question opens with Enter.
    const groom = page.getByLabel('Noivo', { exact: true });
    await groom.focus();
    await page.keyboard.type('Kiame');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Noiva', { exact: true })).toBeFocused();
    const question = page.getByText('Podemos começar por um Save the Date?');
    await question.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/^Sim\. O convite pode começar como Save the Date/)).toBeVisible();
  });

  test('works with the keyboard alone', async ({ page }) => {
    await page.goto(INVITATION);
    // The envelope is the first stop; Enter opens it and focus moves to the invitation.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Abrir o convite' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /^Convite de casamento de/ })).toBeFocused();

    // The gallery comes first. Tab centres a photo, Enter opens the lightbox, arrows move,
    // Escape closes it and returns focus.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const photo = page.getByRole('button', { name: 'Ver a foto 2 em ecrã inteiro' });
    await expect(photo).toBeFocused();
    await page.keyboard.press('Enter');
    const lightbox = page.getByRole('dialog', { name: 'Galeria de fotos' });
    await expect(lightbox).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(lightbox.getByText('3 de 6')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();
    await expect(photo).toBeFocused();

    // Tab reaches the RSVP form (its code loads at the first key, not only near the screen).
    const content = page.locator('main#convite');
    const change = content.getByRole('button', { name: 'Alterar a resposta' });
    await expect(change).toBeEnabled();
    let reached = false;
    for (let step = 0; step < 40 && !reached; step += 1) {
      await page.keyboard.press('Tab');
      reached = await change.evaluate((element) => element === document.activeElement);
    }
    expect(reached, 'Tab reaches "Alterar a resposta"').toBe(true);
  });
});

// One login for all dashboard pages (logins are rate-limited per e-mail). The Praia Rosa event:
// the dashboard tests edit the Champanhe one, and opening an editor clears its preview draft.
test.describe('accessibility: couple dashboard', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  let page: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = await sharedPage(browser, testInfo);
    await signIn(page, COUPLE.email, COUPLE.password);
    await expect(page.getByRole('heading', { name: 'Os meus convites' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('the event list and an event overview', async () => {
    await expectAccessible(page, 'event list');
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Praia Rosa' })
      .first()
      .getByRole('link', { name: /^Abrir/ })
      .click();
    await expect(page.getByRole('heading', { name: 'Resumo', level: 1 })).toBeVisible(NAVIGATION);
    await expectAccessible(page, 'event overview');
  });

  test('the guest list and its dialogs (nothing is saved or sent)', async () => {
    await page
      .getByRole('navigation', { name: 'Páginas do convite' })
      .getByRole('link', { name: 'Convidados' })
      .click();
    await expect(page.getByRole('heading', { name: 'Convidados', level: 1 })).toBeVisible(
      NAVIGATION,
    );
    await expectAccessible(page, 'guest list');

    await page.getByRole('button', { name: 'Adicionar convidado' }).click();
    const add = page.getByRole('dialog', { name: 'Novo convidado' });
    await expect(add).toBeVisible();
    await expectAccessible(page, 'add-guest dialog');
    // Sent empty: the errors must be tied to their fields.
    await add.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(add.getByLabel('Nome no convite')).toHaveAttribute('aria-invalid', 'true');
    await expectAccessible(page, 'add-guest dialog with errors');
    await page.keyboard.press('Escape');
    await expect(add).toBeHidden();

    await page.getByRole('button', { name: 'Importar lista (CSV)' }).click();
    const csv = page.getByRole('dialog', { name: 'Importar convidados' });
    await expect(csv).toBeVisible();
    await expectAccessible(page, 'CSV import dialog');
    await page.keyboard.press('Escape');
    await expect(csv).toBeHidden();

    await page
      .getByRole('button', { name: /^Enviar pelo WhatsApp a / })
      .first()
      .click();
    const send = page.getByRole('dialog', { name: /^Enviar a / });
    await expect(send).toBeVisible();
    await expectAccessible(page, 'send dialog');
    await page.keyboard.press('Escape');
    await expect(send).toBeHidden();
  });

  test('every tab of the editor', async () => {
    await page
      .getByRole('navigation', { name: 'Páginas do convite' })
      .getByRole('link', { name: 'Editar convite' })
      .click();
    await expect(page.getByRole('heading', { name: 'Editar convite', level: 1 })).toBeVisible(
      NAVIGATION,
    );
    const tabs = page.getByRole('tablist', { name: 'Partes do convite' }).getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(3);
    for (let index = 0; index < count; index += 1) {
      const tab = tabs.nth(index);
      const name = (await tab.textContent())?.trim() ?? `tab ${index + 1}`;
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expectAccessible(page, `editor: ${name}`);
    }
  });

  test('the account page', async () => {
    await page.goto('/painel/conta');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(NAVIGATION);
    await expectAccessible(page, 'account');
  });

  test('works with the keyboard alone', async () => {
    // The skip link comes first and moves focus to the content.
    await page.goto('/painel');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar para o conteúdo' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#conteudo')).toBeFocused();

    // The editor's tabs: arrows, Home and End.
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Praia Rosa' })
      .first()
      .getByRole('link', { name: /^Abrir/ })
      .click();
    await page
      .getByRole('navigation', { name: 'Páginas do convite' })
      .getByRole('link', { name: 'Editar convite' })
      .click();
    const tabs = page.getByRole('tablist', { name: 'Partes do convite' }).getByRole('tab');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();

    // A form dialog opens on its first field, Escape closes it and returns focus.
    await page
      .getByRole('navigation', { name: 'Páginas do convite' })
      .getByRole('link', { name: 'Convidados' })
      .click();
    const add = page.getByRole('button', { name: 'Adicionar convidado' });
    await add.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Novo convidado' });
    await expect(dialog.getByLabel('Nome no convite')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
  });
});

test.describe('accessibility: admin area', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  let page: Page;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = await sharedPage(browser, testInfo);
    await signIn(page, ADMIN.email, ADMIN.password);
    await expect(page.getByRole('heading', { name: 'Eventos', level: 1 })).toBeVisible({
      timeout: 30_000,
    });
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('events, accounts, the log and the forms', async () => {
    await expectAccessible(page, 'admin: events');
    for (const [path, heading] of [
      ['/admin/eventos/novo', 'Novo evento'],
      ['/admin/contas', 'Contas'],
      ['/admin/contas/nova', 'Nova conta'],
      ['/admin/registo', 'Registo de atividade'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible(NAVIGATION);
      await expectAccessible(page, `admin: ${heading}`);
    }

    // An event's and an account's page: the newest ones (the admin tests add some every run).
    await page.goto('/admin');
    await page
      .getByRole('link', { name: /^Gerir o evento de / })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/eventos\/[0-9a-f-]+$/, NAVIGATION);
    await expectAccessible(page, 'admin: event');
    await page.goto('/admin/contas');
    await page
      .getByRole('link', { name: /^Gerir a conta de / })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/contas\/[^/]+$/, NAVIGATION);
    await expectAccessible(page, 'admin: account');
  });
});
