import { verifyPassword } from 'better-auth/crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_GUESTS, DEMO_USERS } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';

const prisma = createTestPrisma();
const passwords = { couplePassword: 'couple-test-pass', adminPassword: 'admin-test-pass' };

beforeAll(async () => {
  await wipeDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function counts() {
  const [users, accounts, events, locations, timeline, rules, guests, rsvps, views] =
    await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.event.count(),
      prisma.eventLocation.count(),
      prisma.timelineItem.count(),
      prisma.guestRule.count(),
      prisma.guest.count(),
      prisma.rsvp.count(),
      prisma.invitationView.count(),
    ]);
  return { users, accounts, events, locations, timeline, rules, guests, rsvps, views };
}

describe('demo seed', () => {
  it('creates the full demo and can run again without duplicating anything', async () => {
    const first = await seedDemo(prisma, passwords);
    const afterFirst = await counts();
    const second = await seedDemo(prisma, passwords);

    expect(second.eventId).toBe(first.eventId);
    expect(await counts()).toEqual(afterFirst);
    expect(afterFirst).toEqual({
      users: 2,
      accounts: 2,
      events: 1,
      locations: 2,
      timeline: 7,
      rules: 8,
      guests: DEMO_GUESTS.length,
      rsvps: DEMO_GUESTS.filter((guest) => guest.rsvp).length,
      views: DEMO_GUESTS.reduce((total, guest) => total + guest.views.length, 0),
    });
  });

  it('creates logins that Better Auth accepts, with the right roles', async () => {
    for (const [user, password] of [
      [DEMO_USERS.couple, passwords.couplePassword],
      [DEMO_USERS.admin, passwords.adminPassword],
    ] as const) {
      const saved = await prisma.user.findUniqueOrThrow({
        where: { email: user.email },
        include: { accounts: true },
      });
      expect(saved.role).toBe(user.role);
      const credential = saved.accounts.find((account) => account.providerId === 'credential');
      expect(credential?.accountId).toBe(saved.id);
      expect(await verifyPassword({ hash: credential?.password ?? '', password })).toBe(true);
      expect(await verifyPassword({ hash: credential?.password ?? '', password: 'wrong' })).toBe(
        false,
      );
    }
  });

  it('covers every guest state the dashboard shows', async () => {
    const guests = await prisma.guest.findMany({ include: { rsvp: true, views: true } });
    const state = (guest: (typeof guests)[number]) => {
      if (guest.rsvp?.attending === true) return 'confirmed';
      if (guest.rsvp?.attending === false) return 'declined';
      if (guest.rsvp?.whatsappIntentAt) return 'whatsapp-intent';
      return guest.views.length > 0 ? 'opened' : 'not-opened';
    };
    expect(new Set(guests.map(state))).toEqual(
      new Set(['confirmed', 'declined', 'whatsapp-intent', 'opened', 'not-opened']),
    );
  });
});
