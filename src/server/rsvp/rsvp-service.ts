import 'server-only';

import type { GuestRsvp } from '@/features/invitation/types';
import type { RsvpAnswer } from '@/lib/validation/rsvp';
import { getPrisma } from '@/server/db/prisma';

/** Reading and saving a guest's RSVP. Callers check the link, the mode and the deadline first. */

const rsvpSelect = {
  attending: true,
  peopleCount: true,
  companionNames: true,
  message: true,
  updatedAt: true,
} as const;

function toGuestRsvp(row: {
  attending: boolean | null;
  peopleCount: number | null;
  companionNames: string[];
  message: string | null;
  updatedAt: Date;
}): GuestRsvp {
  return { ...row, updatedAt: row.updatedAt.toISOString() };
}

export async function getGuestRsvp(guestId: string): Promise<GuestRsvp | null> {
  const row = await getPrisma().rsvp.findUnique({ where: { guestId }, select: rsvpSelect });
  return row ? toGuestRsvp(row) : null;
}

/** Creates or replaces the guest's form answer (keeps any earlier WhatsApp tap). */
export async function saveFormRsvp(guestId: string, answer: RsvpAnswer): Promise<GuestRsvp> {
  const data = {
    source: 'FORM',
    attending: answer.attending,
    peopleCount: answer.peopleCount,
    companionNames: answer.companionNames,
    message: answer.message,
  } as const;
  const row = await getPrisma().rsvp.upsert({
    where: { guestId },
    create: { guestId, ...data },
    update: data,
    select: rsvpSelect,
  });
  return toGuestRsvp(row);
}

/**
 * Records a tap on a WhatsApp confirmation button. Never overwrites a form answer: an existing
 * RSVP only gets the time and target of the latest tap.
 */
export async function recordWhatsappIntent(
  guestId: string,
  target: 'GROOM' | 'BRIDE',
  at: Date,
): Promise<void> {
  await getPrisma().rsvp.upsert({
    where: { guestId },
    create: {
      guestId,
      source: 'WHATSAPP_CLICK',
      attending: null,
      whatsappIntentAt: at,
      whatsappIntentTarget: target,
    },
    update: { whatsappIntentAt: at, whatsappIntentTarget: target },
    select: { id: true },
  });
}
