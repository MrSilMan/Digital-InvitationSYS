import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';

import type { Prisma } from '@/generated/prisma/client';
import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';
import { isGuestToken } from '@/lib/guest-token';
import { normalizeAngolanPhone } from '@/lib/validation/phone';
import { DEFAULT_SECTION_CONFIG } from '@/lib/validation/sections';
import type { AppPrismaClient } from '@/server/db/client';

import {
  DEMO_EVENT,
  DEMO_GUESTS,
  DEMO_LOCATIONS,
  DEMO_TIMELINE,
  DEMO_USERS,
  type DemoGuest,
} from './demo-data';

type Tx = Prisma.TransactionClient;

export interface SeedDemoOptions {
  couplePassword: string;
  adminPassword: string;
}

export interface SeedDemoResult {
  eventId: string;
  slug: string;
  users: { email: string; role: string }[];
  guests: { displayName: string; token: string }[];
}

/**
 * Creates or refreshes the demo data. Idempotent: users and the event are upserted, the event's
 * lists are rebuilt, guests keep their tokens, and RSVPs/views are reset to the demo state.
 */
export async function seedDemo(
  prisma: AppPrismaClient,
  options: SeedDemoOptions,
): Promise<SeedDemoResult> {
  // Same hashing as Better Auth's email + password sign-in (scrypt), done before the
  // transaction because it is deliberately slow.
  const [coupleHash, adminHash] = await Promise.all([
    hashPassword(options.couplePassword),
    hashPassword(options.adminPassword),
  ]);

  return prisma.$transaction(
    async (tx) => {
      const couple = await upsertCredentialUser(tx, DEMO_USERS.couple, coupleHash);
      await upsertCredentialUser(tx, DEMO_USERS.admin, adminHash);

      const eventData = {
        ownerId: couple.id,
        phase: DEMO_EVENT.phase,
        isActive: true,
        guestLimit: DEMO_EVENT.guestLimit,
        themeId: DEMO_EVENT.themeId,
        monogram: DEMO_EVENT.monogram,
        groomName: DEMO_EVENT.groomName,
        brideName: DEMO_EVENT.brideName,
        groomParents: [...DEMO_EVENT.groomParents],
        brideParents: [...DEMO_EVENT.brideParents],
        startsAt: DEMO_EVENT.startsAt,
        endsAt: DEMO_EVENT.endsAt,
        introLine: null,
        invitationLine: null,
        celebrationLine: null,
        infoBoxText: null,
        coupleMessage: DEMO_EVENT.coupleMessage,
        dressCodeText: DEMO_EVENT.dressCodeText,
        dressCodeColors: [...DEMO_EVENT.dressCodeColors],
        giftText: DEMO_EVENT.giftText,
        giftIban: DEMO_EVENT.giftIban,
        giftAccountHolder: DEMO_EVENT.giftAccountHolder,
        rsvpMode: DEMO_EVENT.rsvpMode,
        rsvpDeadline: DEMO_EVENT.rsvpDeadline,
        groomWhatsapp: DEMO_EVENT.groomWhatsapp,
        brideWhatsapp: DEMO_EVENT.brideWhatsapp,
        // The demo shows every section, including the optional ones.
        sectionConfig: DEFAULT_SECTION_CONFIG.map((section) => ({ ...section, visible: true })),
      } satisfies Omit<Prisma.EventUncheckedCreateInput, 'slug'>;

      const event = await tx.event.upsert({
        where: { slug: DEMO_EVENT.slug },
        create: { slug: DEMO_EVENT.slug, ...eventData },
        update: eventData,
      });

      await tx.eventLocation.deleteMany({ where: { eventId: event.id } });
      await tx.eventLocation.createMany({
        data: DEMO_LOCATIONS.map((location, position) => ({
          ...location,
          eventId: event.id,
          position,
        })),
      });

      await tx.timelineItem.deleteMany({ where: { eventId: event.id } });
      await tx.timelineItem.createMany({
        data: DEMO_TIMELINE.map((item, position) => ({ ...item, eventId: event.id, position })),
      });

      await tx.guestRule.deleteMany({ where: { eventId: event.id } });
      await tx.guestRule.createMany({
        data: DEFAULT_GUEST_RULES.map((rule, position) => ({
          ...rule,
          eventId: event.id,
          position,
        })),
      });

      // Guests removed from the demo list disappear (with their RSVPs and views).
      await tx.guest.deleteMany({
        where: { eventId: event.id, token: { notIn: DEMO_GUESTS.map((guest) => guest.token) } },
      });
      for (const guest of DEMO_GUESTS) await upsertGuest(tx, event.id, guest);

      return {
        eventId: event.id,
        slug: event.slug,
        users: [DEMO_USERS.couple, DEMO_USERS.admin].map(({ email, role }) => ({ email, role })),
        guests: DEMO_GUESTS.map(({ displayName, token }) => ({ displayName, token })),
      };
    },
    { timeout: 30_000 },
  );
}

/** A Better Auth user with an email + password ("credential") account. */
async function upsertCredentialUser(
  tx: Tx,
  user: { name: string; email: string; role: string },
  passwordHash: string,
) {
  const existing = await tx.user.findUnique({ where: { email: user.email } });
  const saved = existing
    ? await tx.user.update({
        where: { id: existing.id },
        data: { name: user.name, role: user.role, emailVerified: true, banned: false },
      })
    : await tx.user.create({
        data: {
          id: randomUUID(),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: true,
        },
      });

  const account = await tx.account.findFirst({
    where: { userId: saved.id, providerId: 'credential' },
  });
  if (account) {
    await tx.account.update({ where: { id: account.id }, data: { password: passwordHash } });
  } else {
    await tx.account.create({
      data: {
        id: randomUUID(),
        userId: saved.id,
        accountId: saved.id,
        providerId: 'credential',
        password: passwordHash,
      },
    });
  }
  return saved;
}

async function upsertGuest(tx: Tx, eventId: string, guest: DemoGuest): Promise<void> {
  if (!isGuestToken(guest.token)) throw new Error(`Invalid demo token: ${guest.token}`);
  const phone = guest.phone === null ? null : normalizeAngolanPhone(guest.phone);
  if (guest.phone !== null && phone === null) {
    throw new Error(`Invalid demo phone for ${guest.displayName}`);
  }

  const data = {
    eventId,
    displayName: guest.displayName,
    phone,
    seatsAllowed: guest.seatsAllowed,
    groupTag: guest.groupTag,
  };
  const saved = await tx.guest.upsert({
    where: { token: guest.token },
    create: { token: guest.token, ...data },
    update: data,
  });

  await tx.invitationView.deleteMany({ where: { guestId: saved.id } });
  if (guest.views.length > 0) {
    await tx.invitationView.createMany({
      data: guest.views.map((openedAt) => ({ guestId: saved.id, openedAt })),
    });
  }

  await tx.rsvp.deleteMany({ where: { guestId: saved.id } });
  if (guest.rsvp) {
    await tx.rsvp.create({
      data: {
        guestId: saved.id,
        source: guest.rsvp.source,
        attending: guest.rsvp.attending,
        peopleCount: guest.rsvp.peopleCount ?? null,
        companionNames: guest.rsvp.companionNames ?? [],
        message: guest.rsvp.message ?? null,
        whatsappIntentAt: guest.rsvp.whatsappIntent?.at ?? null,
        whatsappIntentTarget: guest.rsvp.whatsappIntent?.target ?? null,
      },
    });
  }
}
