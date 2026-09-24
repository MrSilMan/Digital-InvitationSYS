import type { Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { submitRsvp } from '@/features/invitation/rsvp/actions';
import { getPrisma } from '@/server/db/prisma';
import { invalidateInvitationEvent } from '@/server/invitations/queries';
import { recordInvitationView } from '@/server/invitations/views';
import { recordWhatsappIntent, saveFormRsvp } from '@/server/rsvp/rsvp-service';

import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_EVENT, DEMO_SAVE_THE_DATE } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';

// The Server Action reads the client IP from the request headers.
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.50' }),
}));

const prisma = createTestPrisma();
let redis: Redis;

const byToken = (token: string) =>
  prisma.guest.findUniqueOrThrow({ where: { token }, include: { rsvp: true } });

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  await seedDemo(prisma, { couplePassword: 'couple-test-pass', adminPassword: 'admin-test-pass' });
  redis = await connectAppRedis();
});

afterAll(async () => {
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

describe('RSVP storage', () => {
  it('creates, then replaces, the form answer', async () => {
    const guest = await byToken('demo-familia-cassule06');
    expect(guest.rsvp).toBeNull();

    const first = await saveFormRsvp(guest.id, {
      attending: true,
      peopleCount: 3,
      companionNames: ['Rui Cassule'],
      message: 'Até lá!',
    });
    expect(first).toMatchObject({
      attending: true,
      peopleCount: 3,
      companionNames: ['Rui Cassule'],
    });

    await saveFormRsvp(guest.id, {
      attending: false,
      peopleCount: 0,
      companionNames: [],
      message: null,
    });
    const saved = (await byToken('demo-familia-cassule06')).rsvp;
    expect(saved).toMatchObject({
      source: 'FORM',
      attending: false,
      peopleCount: 0,
      message: null,
    });
  });

  it('records a WhatsApp tap without ever overwriting a form answer', async () => {
    const answered = await byToken('demo-ana-e-pedro-00002'); // form: attending, 2 people
    const at = new Date('2026-10-01T12:00:00Z');
    await recordWhatsappIntent(answered.id, 'BRIDE', at);
    expect((await byToken('demo-ana-e-pedro-00002')).rsvp).toMatchObject({
      source: 'FORM',
      attending: true,
      peopleCount: 2,
      whatsappIntentAt: at,
      whatsappIntentTarget: 'BRIDE',
    });

    const fresh = await byToken('demo-familia-domingos9'); // no RSVP yet
    await recordWhatsappIntent(fresh.id, 'GROOM', at);
    expect((await byToken('demo-familia-domingos9')).rsvp).toMatchObject({
      source: 'WHATSAPP_CLICK',
      attending: null,
      whatsappIntentTarget: 'GROOM',
    });
  });
});

describe('view tracking', () => {
  const views = (guestId: string) => prisma.invitationView.count({ where: { guestId } });

  it('records at most one view per guest per hour (Redis)', async () => {
    const guest = await byToken('demo-carlos-mendes-008');
    const before = await views(guest.id);
    expect(await recordInvitationView(guest.id)).toBe(true);
    expect(await recordInvitationView(guest.id)).toBe(false);
    expect(await views(guest.id)).toBe(before + 1);
    expect(await redis.ttl(`convites:view:${guest.id}`)).toBeGreaterThan(3_500);
  });

  it('falls back to Postgres to de-duplicate when Redis is unavailable', async () => {
    const guest = await byToken('demo-madalena-costa-10');
    const now = new Date('2026-10-02T10:00:00Z');
    const before = await views(guest.id);
    expect(await recordInvitationView(guest.id, { redis: null, now })).toBe(true);
    const halfHourLater = new Date(now.getTime() + 30 * 60_000);
    expect(await recordInvitationView(guest.id, { redis: null, now: halfHourLater })).toBe(false);
    const twoHoursLater = new Date(now.getTime() + 2 * 3_600_000);
    expect(await recordInvitationView(guest.id, { redis: null, now: twoHoursLater })).toBe(true);
    expect(await views(guest.id)).toBe(before + 2);
  });
});

describe('RSVP Server Action', () => {
  const token = 'demo-joao-manuel-00005'; // 1 seat, no RSVP
  const answer = {
    attending: 'sim',
    peopleCount: '1',
    companionNames: [],
    message: 'Conto os dias!',
  };
  const submit = (overrides: Record<string, unknown> = {}) =>
    submitRsvp({ eventSlug: DEMO_EVENT.slug, guestToken: token, answer, ...overrides });

  beforeEach(async () => {
    await redis.del(...(await redis.keys('convites:rl:*')), 'convites:none');
  });

  it("saves a valid answer, checked against the guest's seats", async () => {
    const result = await submit();
    expect(result).toMatchObject({ ok: true, rsvp: { attending: true, peopleCount: 1 } });
    expect((await byToken(token)).rsvp).toMatchObject({
      source: 'FORM',
      message: 'Conto os dias!',
    });
  });

  it('refuses more people than seats, whatever the browser sent', async () => {
    expect(await submit({ answer: { ...answer, peopleCount: '2' } })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('refuses unknown links, WhatsApp-only events and answers after the deadline', async () => {
    expect(await submit({ guestToken: 'demo-no-such-guest-000' })).toEqual({
      ok: false,
      error: 'not-found',
    });
    expect(
      await submitRsvp({
        eventSlug: DEMO_SAVE_THE_DATE.slug,
        guestToken: DEMO_SAVE_THE_DATE.guests[0].token,
        answer,
      }),
    ).toEqual({ ok: false, error: 'not-allowed' });

    await prisma.event.update({
      where: { slug: DEMO_EVENT.slug },
      data: { rsvpDeadline: new Date('2020-01-01T00:00:00Z') },
    });
    await invalidateInvitationEvent(DEMO_EVENT.slug);
    try {
      expect(await submit()).toEqual({ ok: false, error: 'closed' });
    } finally {
      await prisma.event.update({
        where: { slug: DEMO_EVENT.slug },
        data: { rsvpDeadline: DEMO_EVENT.rsvpDeadline },
      });
      await invalidateInvitationEvent(DEMO_EVENT.slug);
    }
  });

  it('rate-limits submissions per guest link', async () => {
    const results = [];
    for (let index = 0; index < 11; index += 1) results.push(await submit());
    expect(results.slice(0, 10).every((result) => result.ok)).toBe(true);
    expect(results[10]).toEqual({ ok: false, error: 'rate-limited' });
  });
});
