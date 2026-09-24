import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getPrisma } from '@/server/db/prisma';
import { getInvitation, invalidateInvitationEvent } from '@/server/invitations/queries';

import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_EVENT, DEMO_GUESTS, DEMO_SAVE_THE_DATE } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';

const prisma = createTestPrisma();
const [silva, ...otherGuests] = DEMO_GUESTS;

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  await seedDemo(prisma, { couplePassword: 'couple-test-pass', adminPassword: 'admin-test-pass' });
  await connectAppRedis();
});

afterAll(async () => {
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

describe('guest invitation lookup', () => {
  it('returns the event and this one guest', async () => {
    const invitation = await getInvitation(DEMO_EVENT.slug, silva!.token);
    expect(invitation?.guest).toEqual({
      id: expect.any(String),
      displayName: 'Família Silva',
      seatsAllowed: 4,
    });
    expect(invitation?.event).toMatchObject({
      slug: DEMO_EVENT.slug,
      phase: 'INVITATION',
      groomName: 'Braúlio',
      brideName: 'Nanda',
      startsAt: '2027-01-15T15:00:00.000Z',
    });
    expect(invitation?.event.locations.map((location) => location.venueName)).toEqual([
      'Praia do Bispo',
      'Salão de Festas Jardim das Rosas',
    ]);
    expect(invitation?.event.timeline).toHaveLength(7);
    expect(invitation?.event.rules).toHaveLength(8);
    expect(invitation?.event.gallery).toHaveLength(6);
    expect(invitation?.event.music).toEqual({ src: '/demo/musica.wav', mimeType: 'audio/wav' });
  });

  it("never exposes other guests, guests' phone numbers or tokens", async () => {
    const json = JSON.stringify(await getInvitation(DEMO_EVENT.slug, silva!.token));
    for (const guest of otherGuests) {
      expect(json).not.toContain(guest.displayName);
      expect(json).not.toContain(guest.token);
    }
    expect(json).not.toContain(silva!.token);
    expect(json).not.toMatch(/\+24490000010\d/);
    expect(json).not.toContain('noivos@convites.test');
  });

  it('does not open a guest link under another event', async () => {
    expect(await getInvitation(DEMO_SAVE_THE_DATE.slug, silva!.token)).toBeNull();
    expect(await getInvitation(DEMO_EVENT.slug, DEMO_SAVE_THE_DATE.guests[0].token)).toBeNull();
  });

  it('rejects unknown and malformed links', async () => {
    expect(await getInvitation(DEMO_EVENT.slug, 'demo-no-such-guest-000')).toBeNull();
    expect(await getInvitation('no-such-event', silva!.token)).toBeNull();
    expect(await getInvitation('Braulio', silva!.token)).toBeNull();
    expect(await getInvitation(DEMO_EVENT.slug, 'short')).toBeNull();
  });

  it('hides inactive events', async () => {
    await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { isActive: false } });
    await invalidateInvitationEvent(DEMO_EVENT.slug);
    try {
      expect(await getInvitation(DEMO_EVENT.slug, silva!.token)).toBeNull();
    } finally {
      await prisma.event.update({ where: { slug: DEMO_EVENT.slug }, data: { isActive: true } });
      await invalidateInvitationEvent(DEMO_EVENT.slug);
    }
  });

  it('serves the Save the Date event in its phase', async () => {
    const invitation = await getInvitation(
      DEMO_SAVE_THE_DATE.slug,
      DEMO_SAVE_THE_DATE.guests[0].token,
    );
    expect(invitation?.event.phase).toBe('SAVE_THE_DATE');
    expect(invitation?.guest.displayName).toBe('Família Silva');
  });
});
