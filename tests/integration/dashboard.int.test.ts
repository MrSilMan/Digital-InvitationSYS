import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { signIn, signOut } from '@/features/auth/actions';
import {
  discardPreviewDraft,
  saveEvent,
  savePreviewDraft,
} from '@/features/dashboard/editor/actions';
import { eventEditorSchema } from '@/lib/validation/event-editor';
import { getAuth } from '@/server/auth/auth';
import { getSessionUser } from '@/server/auth/session';
import { getPrisma } from '@/server/db/prisma';
import { authorizeEventAction } from '@/server/events/access';
import { loadEventRow, loadPreviewEvent, toEditorValues } from '@/server/events/editor';
import { getInvitation } from '@/server/invitations/queries';

import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_EVENT, DEMO_USERS } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';

// Server Actions and Better Auth read the request headers and set cookies through next/headers.
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
const other = { email: 'outros@convites.test', password: 'outro-casal-pass' };
const guestToken = 'demo-familia-silva-001';

let eventId: string;
const cookies: Record<'couple' | 'admin' | 'other', string> = { couple: '', admin: '', other: '' };
const userIds: Record<'couple' | 'admin', string> = { couple: '', admin: '' };

/** Signs in through Better Auth and returns the session cookie for later requests. */
async function sessionCookie(email: string, password: string): Promise<string> {
  const response = await getAuth().api.signInEmail({ body: { email, password }, asResponse: true });
  const setCookie = response.headers.get('set-cookie') ?? '';
  const cookie = /(?:__Secure-)?convites\.session_token=[^;]+/.exec(setCookie)?.[0];
  if (!cookie) throw new Error(`No session cookie for ${email}`);
  return cookie;
}

/** The next action runs as this visitor (or signed out). */
function as(cookie: string | null) {
  requestHeaders = new Headers({
    'x-forwarded-for': '203.0.113.70',
    ...(cookie ? { cookie } : {}),
  });
}

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  const seeded = await seedDemo(prisma, passwords);
  eventId = seeded.eventId;
  await connectAppRedis();

  const otherId = randomUUID();
  await prisma.user.create({
    data: {
      id: otherId,
      name: 'Outro casal',
      email: other.email,
      role: 'couple',
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: otherId,
          providerId: 'credential',
          password: await hashPassword(other.password),
        },
      },
    },
  });

  cookies.couple = await sessionCookie(DEMO_USERS.couple.email, passwords.couplePassword);
  cookies.admin = await sessionCookie(DEMO_USERS.admin.email, passwords.adminPassword);
  cookies.other = await sessionCookie(other.email, other.password);
  for (const role of ['couple', 'admin'] as const) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_USERS[role].email } });
    userIds[role] = user.id;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

describe('login', () => {
  it('signs in and returns to the requested dashboard page', async () => {
    as(null);
    await expect(
      signIn(
        { email: DEMO_USERS.couple.email.toUpperCase(), password: passwords.couplePassword },
        `/painel/eventos/${eventId}`,
      ),
    ).rejects.toMatchObject({ digest: expect.stringContaining(`/painel/eventos/${eventId}`) });
  });

  it('refuses a wrong password, then locks the account after too many attempts', async () => {
    as(null);
    const attempt = () => signIn({ email: other.email, password: 'errada' });
    for (let i = 0; i < 8; i += 1) {
      await expect(attempt()).resolves.toEqual({ ok: false, error: 'invalid-credentials' });
    }
    await expect(attempt()).resolves.toEqual({ ok: false, error: 'rate-limited' });
  });

  it('knows who is signed in, and signs out', async () => {
    as(cookies.couple);
    await expect(getSessionUser()).resolves.toMatchObject({
      email: DEMO_USERS.couple.email,
      role: 'couple',
    });
    as(cookies.admin);
    await expect(getSessionUser()).resolves.toMatchObject({ role: 'admin' });

    const cookie = await sessionCookie(DEMO_USERS.couple.email, passwords.couplePassword);
    as(cookie);
    await expect(signOut()).rejects.toMatchObject({ digest: expect.stringContaining('/entrar') });
    await expect(getSessionUser()).resolves.toBeNull();
  });
});

describe('who may edit an event', () => {
  it('lets the couple and admins in, and nobody else', async () => {
    as(cookies.couple);
    await expect(authorizeEventAction(eventId)).resolves.toMatchObject({ ok: true });
    as(cookies.admin);
    await expect(authorizeEventAction(eventId)).resolves.toMatchObject({ ok: true });
    as(cookies.other);
    await expect(authorizeEventAction(eventId)).resolves.toEqual({ ok: false, error: 'not-found' });
    await expect(authorizeEventAction('not-a-uuid')).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
    as(null);
    await expect(authorizeEventAction(eventId)).resolves.toEqual({
      ok: false,
      error: 'unauthenticated',
    });
  });
});

describe('event editor', () => {
  async function currentValues() {
    const row = await loadEventRow(eventId);
    if (!row) throw new Error('demo event missing');
    return toEditorValues(row);
  }

  it('saves every field and refreshes the copy guests see', async () => {
    // Cached read model before the change.
    await getInvitation(DEMO_EVENT.slug, guestToken);
    const values = await currentValues();

    as(cookies.couple);
    const result = await saveEvent(eventId, {
      ...values,
      coupleMessage: 'Mensagem nova',
      venues: values.venues.slice(1),
      timeline: values.timeline.slice(0, 2),
    });
    expect(result).toMatchObject({ ok: true, values: { coupleMessage: 'Mensagem nova' } });

    const invitation = await getInvitation(DEMO_EVENT.slug, guestToken);
    expect(invitation?.event.coupleMessage).toBe('Mensagem nova');
    expect(invitation?.event.locations.map((location) => location.venueName)).toEqual([
      values.venues[1]?.venueName,
    ]);
    expect(invitation?.event.timeline).toHaveLength(2);
  });

  it('refuses invalid values and other couples', async () => {
    const values = await currentValues();
    as(cookies.couple);
    await expect(saveEvent(eventId, { ...values, groomName: '' })).resolves.toMatchObject({
      ok: false,
      error: 'invalid',
      issues: [{ path: 'groomName' }],
    });

    as(cookies.other);
    await expect(saveEvent(eventId, { ...values, groomName: 'Intruso' })).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
    expect((await currentValues()).groomName).toBe(values.groomName);
  });

  it('round-trips through the editor without changing anything', async () => {
    as(cookies.couple);
    const first = await currentValues();
    expect(await saveEvent(eventId, first)).toMatchObject({ ok: true });
    const second = await currentValues();
    expect(await saveEvent(eventId, second)).toMatchObject({ ok: true });
    expect(await currentValues()).toEqual(second);
    expect(eventEditorSchema.safeParse(second).success).toBe(true);
  });
});

describe('live preview drafts', () => {
  it('shows unsaved changes to their author only, until they are discarded', async () => {
    const row = await loadEventRow(eventId);
    const values = toEditorValues(row!);
    const saved = row!.coupleMessage;

    as(cookies.couple);
    await expect(
      savePreviewDraft(eventId, { ...values, coupleMessage: 'Rascunho por guardar' }),
    ).resolves.toEqual({ ok: true });

    expect((await loadPreviewEvent(eventId, userIds.couple))?.coupleMessage).toBe(
      'Rascunho por guardar',
    );
    expect((await loadPreviewEvent(eventId, userIds.admin))?.coupleMessage).toBe(saved);
    expect((await getInvitation(DEMO_EVENT.slug, guestToken))?.event.coupleMessage).toBe(saved);

    await expect(discardPreviewDraft(eventId)).resolves.toEqual({ ok: true });
    expect((await loadPreviewEvent(eventId, userIds.couple))?.coupleMessage).toBe(saved);
  });

  it('refuses oversized drafts and other couples', async () => {
    as(cookies.couple);
    await expect(
      savePreviewDraft(eventId, { coupleMessage: 'x'.repeat(200_000) }),
    ).resolves.toEqual({ ok: false, error: 'invalid' });
    as(cookies.other);
    await expect(savePreviewDraft(eventId, {})).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
  });
});
