import { randomUUID } from 'node:crypto';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createGuestToken } from '@/lib/guest-token';

import { createTestPrisma, wipeDatabase } from './db';

const prisma = createTestPrisma();

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await wipeDatabase(prisma);
});

async function createUser(role = 'couple') {
  return prisma.user.create({
    data: { id: randomUUID(), name: 'Teste', email: `${randomUUID()}@convites.test`, role },
  });
}

async function createEvent(ownerId: string, slug = `evento-${Date.now()}`) {
  return prisma.event.create({
    data: {
      ownerId,
      slug,
      groomName: 'Noivo',
      brideName: 'Noiva',
      startsAt: new Date('2027-01-15T15:00:00Z'),
    },
  });
}

async function createGuest(eventId: string, token = createGuestToken()) {
  return prisma.guest.create({ data: { eventId, token, displayName: 'Família Teste' } });
}

describe('database schema', () => {
  it('finds a guest and their event by token', async () => {
    const owner = await createUser();
    const event = await createEvent(owner.id, 'noivo-e-noiva');
    const token = createGuestToken();
    await createGuest(event.id, token);

    const found = await prisma.guest.findUnique({ where: { token }, include: { event: true } });

    expect(found?.displayName).toBe('Família Teste');
    expect(found?.event.slug).toBe('noivo-e-noiva');
    expect(found?.seatsAllowed).toBe(1);
    expect(await prisma.guest.findUnique({ where: { token: createGuestToken() } })).toBeNull();
  });

  it('applies defaults: empty lists, section config, phase and theme', async () => {
    const event = await createEvent((await createUser()).id);
    expect(event).toMatchObject({
      groomParents: [],
      brideParents: [],
      dressCodeColors: [],
      sectionConfig: [],
      phase: 'SAVE_THE_DATE',
      rsvpMode: 'BOTH',
      themeId: 'praia-rosa',
      isActive: true,
      guestLimit: 150,
    });
  });

  it('keeps guest tokens unique and at least 16 URL-safe characters', async () => {
    const event = await createEvent((await createUser()).id);
    const token = createGuestToken();
    await createGuest(event.id, token);

    await expect(createGuest(event.id, token)).rejects.toThrow();
    await expect(createGuest(event.id, 'too-short')).rejects.toThrow();
    await expect(createGuest(event.id, 'has spaces in it and more')).rejects.toThrow();
  });

  it('enforces the integrity rules in the database itself', async () => {
    const owner = await createUser();
    const event = await createEvent(owner.id);
    const guest = await createGuest(event.id);

    await expect(
      prisma.guest.update({ where: { id: guest.id }, data: { seatsAllowed: 0 } }),
    ).rejects.toThrow();
    await expect(createEvent(owner.id, 'Invalid Slug!')).rejects.toThrow();
    await expect(
      prisma.event.update({
        where: { id: event.id },
        data: { groomParents: ['Pai', 'Mãe', 'Padrinho'] },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.event.update({
        where: { id: event.id },
        data: { endsAt: new Date('2027-01-15T14:00:00Z') },
      }),
    ).rejects.toThrow();
    await expect(createUser('superadmin')).rejects.toThrow();
  });

  it('allows only one RSVP per guest', async () => {
    const event = await createEvent((await createUser()).id);
    const guest = await createGuest(event.id);
    await prisma.rsvp.create({ data: { guestId: guest.id, source: 'FORM', attending: true } });

    await expect(
      prisma.rsvp.create({ data: { guestId: guest.id, source: 'WHATSAPP_CLICK' } }),
    ).rejects.toThrow();
  });

  it('deleting an event removes everything that belongs to it', async () => {
    const event = await createEvent((await createUser()).id);
    const guest = await createGuest(event.id);
    await prisma.rsvp.create({ data: { guestId: guest.id, source: 'FORM', attending: true } });
    await prisma.invitationView.create({ data: { guestId: guest.id } });
    await prisma.eventLocation.create({
      data: { eventId: event.id, heading: 'H', venueName: 'V', startsAt: event.startsAt },
    });
    await prisma.timelineItem.create({ data: { eventId: event.id, label: 'L', icon: 'cake' } });
    await prisma.guestRule.create({ data: { eventId: event.id, text: 'T', icon: 'clock' } });

    await prisma.event.delete({ where: { id: event.id } });

    const remaining = await Promise.all([
      prisma.guest.count(),
      prisma.rsvp.count(),
      prisma.invitationView.count(),
      prisma.eventLocation.count(),
      prisma.timelineItem.count(),
      prisma.guestRule.count(),
    ]);
    expect(remaining).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('never deletes events with their owner, and keeps audit entries of deleted users', async () => {
    const owner = await createUser();
    await createEvent(owner.id);
    await expect(prisma.user.delete({ where: { id: owner.id } })).rejects.toThrow();

    const admin = await createUser('admin');
    const entry = await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'event.activate', targetType: 'event' },
    });
    await prisma.user.delete({ where: { id: admin.id } });

    const kept = await prisma.auditLog.findUniqueOrThrow({ where: { id: entry.id } });
    expect(kept.actorId).toBeNull();
    expect(kept.action).toBe('event.activate');
  });
});
