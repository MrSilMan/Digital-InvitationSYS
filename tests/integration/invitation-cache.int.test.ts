import type { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getPrisma } from '@/server/db/prisma';
import {
  getInvitation,
  invalidateInvitationEvent,
  invalidateInvitationGuest,
  loadInvitationEvent,
  loadInvitationGuest,
} from '@/server/invitations/queries';

import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_EVENT, DEMO_GUESTS } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';

const prisma = createTestPrisma();
const silva = DEMO_GUESTS[0]!;
let redis: Redis;

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

describe('invitation cache', () => {
  it('serves the event from Redis until it is invalidated', async () => {
    const first = await loadInvitationEvent(DEMO_EVENT.slug);
    expect(first?.groomName).toBe('Braúlio');
    expect(await redis.exists(`convites:inv:v1:event:${DEMO_EVENT.slug}`)).toBe(1);

    // A change in Postgres is not seen while the cached copy lives…
    await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { groomName: 'B.' } });
    expect((await loadInvitationEvent(DEMO_EVENT.slug))?.groomName).toBe('Braúlio');

    // …and is seen right after invalidation (what the dashboard will do on every edit).
    await invalidateInvitationEvent(DEMO_EVENT.slug);
    expect((await loadInvitationEvent(DEMO_EVENT.slug))?.groomName).toBe('B.');

    await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { groomName: 'Braúlio' } });
    await invalidateInvitationEvent(DEMO_EVENT.slug);
  });

  it('caches guests under a hash of the token, never the token itself', async () => {
    await loadInvitationGuest(silva.token);
    const keys = await redis.keys('convites:inv:v1:guest:*');
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toContain(silva.token);

    await prisma.guest.update({ where: { token: silva.token }, data: { seatsAllowed: 2 } });
    expect((await loadInvitationGuest(silva.token))?.guest.seatsAllowed).toBe(4);
    await invalidateInvitationGuest(silva.token);
    expect((await loadInvitationGuest(silva.token))?.guest.seatsAllowed).toBe(2);

    await prisma.guest.update({ where: { token: silva.token }, data: { seatsAllowed: 4 } });
    await invalidateInvitationGuest(silva.token);
  });

  it('reads straight from Postgres when Redis is unavailable', async () => {
    await prisma.event.update({
      where: { slug: DEMO_EVENT.slug },
      data: { groomName: 'Sem cache' },
    });
    const event = await loadInvitationEvent(DEMO_EVENT.slug, { redis: null });
    expect(event?.groomName).toBe('Sem cache');
    await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { groomName: 'Braúlio' } });
    await invalidateInvitationEvent(DEMO_EVENT.slug);
  });

  it('still refuses a deactivated event once the cache is invalidated', async () => {
    await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { isActive: false } });
    await invalidateInvitationEvent(DEMO_EVENT.slug);
    try {
      expect(await getInvitation(DEMO_EVENT.slug, silva.token)).toBeNull();
    } finally {
      await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { isActive: true } });
      await invalidateInvitationEvent(DEMO_EVENT.slug);
    }
  });
});
