import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  addAccount,
  addEvent,
  changeAccountSuspension,
  changeEventStatus,
  changeGuestLimit,
  editAccount,
  issueTemporaryPassword,
} from '@/features/admin/actions';
import { changePassword } from '@/features/account/actions';
import { signIn } from '@/features/auth/actions';
import { addGuest } from '@/features/dashboard/guests/actions';
import { DEFAULT_SECTION_CONFIG } from '@/lib/validation/sections';
import { requireAdmin } from '@/server/admin/access';
import { setSuspended } from '@/server/admin/accounts';
import { listAccounts, listAdminEvents, loadAdminEvent } from '@/server/admin/queries';
import { listAuditEntries } from '@/server/audit/queries';
import { getSessionUser } from '@/server/auth/session';
import { getPrisma } from '@/server/db/prisma';
import { getInvitation } from '@/server/invitations/queries';

import { GET as exportGuests } from '../../app/(dashboard)/painel/eventos/[eventId]/convidados/exportar/route';
import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_EVENT, DEMO_GUESTS, DEMO_USERS } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';
import { createCouple, sessionCookie } from './sessions';

// Server Actions, pages and Better Auth read the request headers through next/headers.
let requestHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    set: () => undefined,
    delete: () => undefined,
  }),
}));

const prisma = createTestPrisma();
const passwords = { couplePassword: 'couple-test-pass', adminPassword: 'admin-test-pass' };
const guestToken = DEMO_GUESTS[0]?.token ?? '';

let eventId: string;
let adminId: string;
let coupleId: string;
const cookies = { couple: '', admin: '' };

/** The next action runs as this visitor (or signed out). */
function as(cookie: string | null) {
  requestHeaders = new Headers({
    'x-forwarded-for': '203.0.113.90',
    ...(cookie ? { cookie } : {}),
  });
}

/** The audit entries about one target, oldest first. */
async function entriesFor(targetId: string) {
  return prisma.auditLog.findMany({ where: { targetId }, orderBy: { createdAt: 'asc' } });
}

const newEvent = (overrides: Record<string, unknown> = {}) => ({
  owner: { kind: 'existing', userId: coupleId },
  groomName: 'Ana',
  brideName: 'João',
  date: '2027-06-12',
  time: '15:30',
  slug: 'ana-e-joao',
  themeId: 'champanhe',
  guestLimit: '80',
  ...overrides,
});

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  eventId = (await seedDemo(prisma, passwords)).eventId;
  await connectAppRedis();
  cookies.couple = await sessionCookie(DEMO_USERS.couple.email, passwords.couplePassword);
  cookies.admin = await sessionCookie(DEMO_USERS.admin.email, passwords.adminPassword);
  adminId = (await prisma.user.findUniqueOrThrow({ where: { email: DEMO_USERS.admin.email } })).id;
  coupleId = (await prisma.user.findUniqueOrThrow({ where: { email: DEMO_USERS.couple.email } }))
    .id;
});

afterAll(async () => {
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

describe('who may use the admin area', () => {
  it('answers couples with "not found" and visitors with "sign in", for every action', async () => {
    const calls = [
      () => addAccount({ name: 'X', email: 'x@convites.test' }),
      () => editAccount(coupleId, { name: 'X', email: 'x@convites.test' }),
      () => issueTemporaryPassword(adminId),
      () => changeAccountSuspension(adminId, true),
      () => addEvent(newEvent()),
      () => changeEventStatus(eventId, false),
      () => changeGuestLimit(eventId, '999'),
    ];
    as(cookies.couple);
    for (const call of calls) {
      await expect(call()).resolves.toEqual({ ok: false, error: 'not-found' });
    }
    as(null);
    for (const call of calls) {
      await expect(call()).resolves.toEqual({ ok: false, error: 'unauthenticated' });
    }
    // Nothing was changed, and nothing recorded.
    await expect(prisma.auditLog.count()).resolves.toBe(0);
    await expect(prisma.event.findUniqueOrThrow({ where: { id: eventId } })).resolves.toMatchObject(
      { isActive: true, guestLimit: DEMO_EVENT.guestLimit },
    );
  });

  it('lets admins into the pages and sends couples to "not found"', async () => {
    as(cookies.admin);
    await expect(requireAdmin()).resolves.toMatchObject({ id: adminId, role: 'admin' });
    as(cookies.couple);
    await expect(requireAdmin()).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    });
  });

  it('sends admins to the admin area after login, unless they asked for a page', async () => {
    as(null);
    await expect(
      signIn({ email: DEMO_USERS.admin.email, password: passwords.adminPassword }),
    ).rejects.toMatchObject({ digest: expect.stringContaining(';/admin;') });
    await expect(
      signIn({ email: DEMO_USERS.admin.email, password: passwords.adminPassword }, '/painel'),
    ).rejects.toMatchObject({ digest: expect.stringContaining(';/painel;') });
    await expect(
      signIn({ email: DEMO_USERS.couple.email, password: passwords.couplePassword }),
    ).rejects.toMatchObject({ digest: expect.stringContaining(';/painel;') });
  });
});

describe('accounts', () => {
  const ana = { name: 'Ana  e João', email: 'Ana.Joao@Exemplo.AO' };
  let anaId: string;

  it('creates a couple account whose temporary password signs in, and records it', async () => {
    as(cookies.admin);
    const result = await addAccount(ana);
    if (!result.ok) throw new Error(result.error);
    anaId = result.userId;
    expect(result.credentials.email).toBe('ana.joao@exemplo.ao');
    await expect(
      sessionCookie('ana.joao@exemplo.ao', result.credentials.password),
    ).resolves.toMatch(/convites\.session_token=/);
    await expect(prisma.user.findUniqueOrThrow({ where: { id: anaId } })).resolves.toMatchObject({
      name: 'Ana e João',
      role: 'couple',
    });

    const [entry] = await entriesFor(anaId);
    expect(entry).toMatchObject({ actorId: adminId, action: 'user.create', targetType: 'user' });
    expect(JSON.stringify(entry?.metadata)).not.toContain(result.credentials.password);
  });

  it('refuses an e-mail already in use, without recording anything', async () => {
    as(cookies.admin);
    const before = await prisma.auditLog.count();
    await expect(addAccount({ name: 'Outra', email: DEMO_USERS.couple.email })).resolves.toEqual({
      ok: false,
      error: 'email-taken',
    });
    await expect(addAccount({ name: '', email: 'nope' })).resolves.toMatchObject({
      ok: false,
      error: 'invalid',
      issues: expect.arrayContaining([expect.objectContaining({ path: 'email' })]),
    });
    await expect(prisma.auditLog.count()).resolves.toBe(before);
  });

  it('changes the name and e-mail (the login follows), recording before and after', async () => {
    as(cookies.admin);
    await expect(
      editAccount(anaId, { name: 'Ana e João Silva', email: 'ana@exemplo.ao' }),
    ).resolves.toEqual({ ok: true });
    const entry = (await entriesFor(anaId)).at(-1);
    expect(entry).toMatchObject({ action: 'user.update' });
    expect(entry?.metadata).toMatchObject({
      changes: {
        name: { from: 'Ana e João', to: 'Ana e João Silva' },
        email: { from: 'ana.joao@exemplo.ao', to: 'ana@exemplo.ao' },
      },
    });
    // Unchanged values record nothing; someone else's e-mail is refused.
    const count = await prisma.auditLog.count();
    await expect(
      editAccount(anaId, { name: 'Ana e João Silva', email: 'ana@exemplo.ao' }),
    ).resolves.toEqual({ ok: true });
    await expect(
      editAccount(anaId, { name: 'Ana', email: DEMO_USERS.admin.email }),
    ).resolves.toEqual({ ok: false, error: 'email-taken' });
    await expect(prisma.auditLog.count()).resolves.toBe(count);
  });

  it('issues a new temporary password: the old one and every session stop working', async () => {
    const couple = {
      name: 'Casal Reset',
      email: 'reset@convites.test',
      password: 'senha-antiga-1',
    };
    const userId = await createCouple(prisma, couple);
    const session = await sessionCookie(couple.email, couple.password);

    as(cookies.admin);
    const result = await issueTemporaryPassword(userId);
    if (!result.ok) throw new Error(result.error);

    as(session);
    await expect(getSessionUser()).resolves.toBeNull();
    await expect(sessionCookie(couple.email, couple.password)).rejects.toThrow();
    await expect(sessionCookie(couple.email, result.credentials.password)).resolves.toBeTruthy();
    expect((await entriesFor(userId)).at(-1)).toMatchObject({
      action: 'user.password-reset',
      metadata: { details: { sessionsEnded: 1 } },
    });
  });

  it('suspends an account (sessions end, login refused) and reactivates it', async () => {
    const couple = {
      name: 'Casal Suspenso',
      email: 'suspenso@convites.test',
      password: 'senha-casal-1',
    };
    const userId = await createCouple(prisma, couple);
    const session = await sessionCookie(couple.email, couple.password);

    as(cookies.admin);
    await expect(changeAccountSuspension(userId, true)).resolves.toEqual({ ok: true });
    as(session);
    await expect(getSessionUser()).resolves.toBeNull();
    as(null);
    await expect(signIn({ email: couple.email, password: couple.password })).resolves.toEqual({
      ok: false,
      error: 'suspended',
    });

    as(cookies.admin);
    await expect(changeAccountSuspension(userId, false)).resolves.toEqual({ ok: true });
    await expect(sessionCookie(couple.email, couple.password)).resolves.toBeTruthy();
    expect((await entriesFor(userId)).map((entry) => entry.action)).toEqual([
      'user.suspend',
      'user.unsuspend',
    ]);
    await expect(
      listAccounts({ query: 'suspenso', status: 'active', page: 1 }),
    ).resolves.toMatchObject({ total: 1 });
  });

  it('never lets admins lock themselves or the platform out', async () => {
    as(cookies.admin);
    await expect(changeAccountSuspension(adminId, true)).resolves.toEqual({
      ok: false,
      error: 'own-account',
    });
    await expect(issueTemporaryPassword(adminId)).resolves.toEqual({
      ok: false,
      error: 'own-account',
    });
    // The only active admin cannot be suspended, whoever asks.
    await expect(setSuspended({ id: 'someone-else' }, adminId, true)).resolves.toEqual({
      ok: false,
      error: 'last-admin',
    });
    await expect(getSessionUser()).resolves.toMatchObject({ id: adminId });
  });
});

describe('events', () => {
  it('creates an event with its new couple account in one transaction', async () => {
    as(cookies.admin);
    const result = await addEvent(
      newEvent({ owner: { kind: 'new', name: 'Ana e João', email: 'noivos.aj@exemplo.ao' } }),
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.credentials?.email).toBe('noivos.aj@exemplo.ao');

    const event = await prisma.event.findUniqueOrThrow({
      where: { id: result.eventId },
      include: { owner: true, guestRules: true },
    });
    expect(event).toMatchObject({
      slug: 'ana-e-joao',
      phase: 'SAVE_THE_DATE',
      isActive: true,
      rsvpMode: 'FORM',
      guestLimit: 80,
      themeId: 'champanhe',
      startsAt: new Date('2027-06-12T14:30:00.000Z'),
      sectionConfig: DEFAULT_SECTION_CONFIG,
    });
    expect(event.owner).toMatchObject({ email: 'noivos.aj@exemplo.ao', role: 'couple' });
    expect(event.guestRules).toHaveLength(8);
    await expect(
      sessionCookie('noivos.aj@exemplo.ao', result.credentials?.password ?? ''),
    ).resolves.toBeTruthy();

    const actions = (
      await prisma.auditLog.findMany({
        where: { targetId: { in: [result.eventId, event.ownerId] } },
        orderBy: { createdAt: 'asc' },
      })
    ).map((entry) => entry.action);
    expect(actions).toEqual(['user.create', 'event.create']);
  });

  it('refuses a slug in use with a free suggestion, and writes nothing at all', async () => {
    as(cookies.admin);
    const before = await prisma.auditLog.count();
    await expect(
      addEvent(
        newEvent({
          slug: DEMO_EVENT.slug,
          owner: { kind: 'new', name: 'Casal Novo', email: 'casal.novo@exemplo.ao' },
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      error: 'slug-taken',
      suggestion: `${DEMO_EVENT.slug}-2`,
    });
    // The account was not created either.
    await expect(
      prisma.user.findUnique({ where: { email: 'casal.novo@exemplo.ao' } }),
    ).resolves.toBeNull();
    await expect(prisma.auditLog.count()).resolves.toBe(before);
  });

  it('only gives events to active couple accounts', async () => {
    as(cookies.admin);
    await expect(
      addEvent(newEvent({ slug: 'para-o-admin', owner: { kind: 'existing', userId: adminId } })),
    ).resolves.toEqual({ ok: false, error: 'owner-invalid' });
    await expect(
      addEvent(
        newEvent({
          slug: 'conta-usada',
          owner: { kind: 'new', name: 'X', email: DEMO_USERS.couple.email },
        }),
      ),
    ).resolves.toEqual({ ok: false, error: 'email-taken' });
    await expect(
      prisma.event.count({ where: { slug: { in: ['para-o-admin', 'conta-usada'] } } }),
    ).resolves.toBe(0);
  });

  it('deactivates an event: its guests see "not found" at once, cache or not', async () => {
    await expect(getInvitation(DEMO_EVENT.slug, guestToken)).resolves.not.toBeNull(); // cached now
    as(cookies.admin);
    await expect(changeEventStatus(eventId, false)).resolves.toEqual({ ok: true });
    await expect(getInvitation(DEMO_EVENT.slug, guestToken)).resolves.toBeNull();
    await expect(
      listAdminEvents({ query: '', status: 'inactive', page: 1 }),
    ).resolves.toMatchObject({ total: 1, items: [expect.objectContaining({ id: eventId })] });

    await expect(changeEventStatus(eventId, true)).resolves.toEqual({ ok: true });
    await expect(getInvitation(DEMO_EVENT.slug, guestToken)).resolves.not.toBeNull();
    // A repeated request changes nothing and records nothing.
    await expect(changeEventStatus(eventId, true)).resolves.toEqual({ ok: true });
    const entries = await entriesFor(eventId);
    expect(entries.map((entry) => entry.action)).toEqual(['event.deactivate', 'event.activate']);
    expect(entries[0]?.metadata).toMatchObject({
      label: `${DEMO_EVENT.groomName} & ${DEMO_EVENT.brideName}`,
      changes: { isActive: { from: true, to: false } },
    });
  });

  it('never sets the guest limit below the guests already added', async () => {
    as(cookies.admin);
    const count = await prisma.guest.count({ where: { eventId } });
    await expect(changeGuestLimit(eventId, String(count - 1))).resolves.toEqual({
      ok: false,
      error: 'limit-below-guests',
      count,
    });
    await expect(changeGuestLimit(eventId, '0')).resolves.toMatchObject({
      ok: false,
      error: 'invalid',
    });
    await expect(changeGuestLimit(eventId, String(count))).resolves.toEqual({ ok: true });
    await expect(loadAdminEvent(eventId)).resolves.toMatchObject({ guestLimit: count });

    // The couple is now at the limit.
    as(cookies.couple);
    await expect(
      addGuest(eventId, { displayName: 'Mais um', phone: '', seatsAllowed: '1', groupTag: '' }),
    ).resolves.toEqual({ ok: false, error: 'limit' });

    as(cookies.admin);
    await expect(changeGuestLimit(eventId, String(DEMO_EVENT.guestLimit))).resolves.toEqual({
      ok: true,
    });
    expect((await entriesFor(eventId)).at(-1)?.metadata).toMatchObject({
      changes: { guestLimit: { from: count, to: DEMO_EVENT.guestLimit } },
    });
  });
});

describe('admins in a couple’s dashboard', () => {
  it('records their changes (IDs only), and never the couple’s own', async () => {
    const before = await prisma.auditLog.count({ where: { targetId: eventId } });
    as(cookies.couple);
    const own = await addGuest(eventId, {
      displayName: 'Convidada do Casal',
      phone: '923 000 111',
      seatsAllowed: '2',
      groupTag: '',
    });
    expect(own.ok).toBe(true);
    await expect(prisma.auditLog.count({ where: { targetId: eventId } })).resolves.toBe(before);

    as(cookies.admin);
    const added = await addGuest(eventId, {
      displayName: 'Convidado do Admin',
      phone: '923 000 222',
      seatsAllowed: '1',
      groupTag: '',
    });
    if (!added.ok) throw new Error(added.error);
    const response = await exportGuests(
      new Request(`http://localhost:3000/painel/eventos/${eventId}/convidados/exportar`),
      { params: Promise.resolve({ eventId }) },
    );
    expect(response.status).toBe(200);

    const entries = (await entriesFor(eventId)).slice(before);
    expect(entries.map((entry) => entry.action)).toEqual(['guest.create', 'guest.export']);
    expect(entries[0]).toMatchObject({ actorId: adminId });
    const stored = JSON.stringify(entries.map((entry) => entry.metadata));
    expect(stored).not.toContain('Convidado do Admin');
    expect(stored).not.toContain('923');
  });
});

describe('the audit log', () => {
  it('lists entries newest first, by target and action, with current names', async () => {
    const page = await listAuditEntries({
      action: null,
      target: { type: 'event', id: eventId },
      page: 1,
    });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((entry) => entry.target.id === eventId)).toBe(true);
    expect(page.items[0]?.target).toMatchObject({
      name: `${DEMO_EVENT.groomName} & ${DEMO_EVENT.brideName}`,
      exists: true,
    });
    const times = page.items.map((entry) => entry.createdAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const deactivations = await listAuditEntries({
      action: 'event.deactivate',
      target: null,
      page: 1,
    });
    expect(deactivations.total).toBe(1);
    expect(deactivations.items[0]?.actor).toEqual({ id: adminId, name: DEMO_USERS.admin.name });
  });

  it('cannot be changed or deleted', async () => {
    const entry = await prisma.auditLog.findFirstOrThrow();
    await expect(
      prisma.auditLog.update({ where: { id: entry.id }, data: { action: 'event.create' } }),
    ).rejects.toThrow(/append-only/);
    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(
      /append-only/,
    );
    await expect(prisma.auditLog.deleteMany()).rejects.toThrow(/append-only/);
  });
});

describe('A minha conta', () => {
  it('changes the password with the current one, ending the other sessions only', async () => {
    const couple = {
      name: 'Casal Conta',
      email: 'conta@convites.test',
      password: 'senha-inicial-1',
    };
    await createCouple(prisma, couple);
    const phone = await sessionCookie(couple.email, couple.password);
    const laptop = await sessionCookie(couple.email, couple.password);

    as(laptop);
    await expect(
      changePassword({
        currentPassword: 'errada-errada',
        newPassword: 'a nossa nova senha',
        confirmPassword: 'a nossa nova senha',
      }),
    ).resolves.toEqual({ ok: false, error: 'wrong-password' });
    await expect(
      changePassword({
        currentPassword: couple.password,
        newPassword: 'curta',
        confirmPassword: 'curta',
      }),
    ).resolves.toMatchObject({ ok: false, error: 'invalid' });
    await expect(
      changePassword({
        currentPassword: couple.password,
        newPassword: 'a nossa nova senha',
        confirmPassword: 'a nossa nova senha',
      }),
    ).resolves.toEqual({ ok: true });

    // This session stays signed in with its own cookie: the page shown after the action keeps
    // working (a replaced session would send the user to the login page).
    await expect(getSessionUser()).resolves.toMatchObject({ email: couple.email });
    as(phone);
    await expect(getSessionUser()).resolves.toBeNull();
    await expect(sessionCookie(couple.email, 'a nossa nova senha')).resolves.toBeTruthy();
    await expect(sessionCookie(couple.email, couple.password)).rejects.toThrow();
  });
});

describe('npm run admin:create', () => {
  const run = promisify(execFile);
  const cli = (...args: string[]) =>
    run(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/create-admin.ts', ...args], {
      env: { ...process.env },
    });

  it('creates an admin with a password shown once, recorded as the command line', async () => {
    const { stdout } = await cli('--email=Dona@Convites.test', '--name=Dona da Plataforma');
    const password = /\(shown once\): (\S+)/.exec(stdout)?.[1] ?? '';
    expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    const cookie = await sessionCookie('dona@convites.test', password);
    as(cookie);
    await expect(getSessionUser()).resolves.toMatchObject({ role: 'admin' });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'dona@convites.test' } });
    expect((await entriesFor(user.id))[0]).toMatchObject({
      actorId: null,
      action: 'user.create',
      metadata: { details: { via: 'cli', role: 'admin' } },
    });

    // Running it again changes nothing.
    const again = await cli('--email=dona@convites.test');
    expect(again.stdout).toContain('already an active admin');
  }, 60_000);

  it('promotes an existing account', async () => {
    const couple = {
      name: 'Futura Admin',
      email: 'futura@convites.test',
      password: 'senha-futura-1',
    };
    const userId = await createCouple(prisma, couple);
    await cli('--email=futura@convites.test');
    await expect(prisma.user.findUniqueOrThrow({ where: { id: userId } })).resolves.toMatchObject({
      role: 'admin',
    });
    expect((await entriesFor(userId)).at(-1)).toMatchObject({
      action: 'user.promote',
      metadata: { changes: { role: { from: 'couple', to: 'admin' } } },
    });
    // The password is kept unless --new-password is given.
    await expect(sessionCookie(couple.email, couple.password)).resolves.toBeTruthy();
  }, 60_000);

  it('refuses a missing e-mail or name', async () => {
    await expect(cli('--name=Sem Email')).rejects.toMatchObject({
      stderr: expect.stringContaining('--email'),
    });
    await expect(cli('--email=novo@convites.test')).rejects.toMatchObject({
      stderr: expect.stringContaining('--name is required'),
    });
  }, 60_000);
});
