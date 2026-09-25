import 'server-only';

import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';
import { nextFreeSlug } from '@/lib/events/slug';
import type { NewEventData } from '@/lib/validation/admin';
import { DEFAULT_SECTION_CONFIG } from '@/lib/validation/sections';
import { auditedTransaction } from '@/server/audit/audit-log';
import { insertCredentialUser } from '@/server/auth/credentials';
import { generateTemporaryPassword, hashPassword } from '@/server/auth/passwords';
import { getPrisma } from '@/server/db/prisma';
import { lockEvent } from '@/server/guests/service';
import { invalidateInvitationEvent } from '@/server/invitations/queries';

import { type Actor, isUniqueViolation } from './accounts';

/**
 * Events, as the admin area changes them: creating one for a couple, turning it on and off, and
 * its guest limit (the plan). Every change is recorded in the audit log in its own transaction.
 */

const coupleLabel = (event: { groomName: string; brideName: string }) =>
  `${event.groomName} & ${event.brideName}`;

/** `slug` if free, else the next free variant (braulio-e-nanda-2…). */
export async function findFreeSlug(slug: string): Promise<string> {
  const rows = await getPrisma().event.findMany({
    where: { slug: { startsWith: slug } },
    select: { slug: true },
  });
  return nextFreeSlug(slug, new Set(rows.map((row) => row.slug)));
}

// ── Creating ─────────────────────────────────────────────────────────────────

export type CreateEventResult =
  | {
      ok: true;
      eventId: string;
      /** Set when the couple's account was created with the event (shown once). */
      newAccount: { userId: string; email: string; password: string } | null;
    }
  | { ok: false; error: 'owner-invalid' | 'email-taken' }
  | { ok: false; error: 'slug-taken'; suggestion: string };

/**
 * A new event in the Save the Date phase, with the default guest rules and sections, for an
 * active couple account (existing, or created in the same transaction). RSVPs start in the form
 * mode, which needs no WhatsApp numbers; the couple fills in everything else in the editor.
 */
export async function createEvent(actor: Actor, data: NewEventData): Promise<CreateEventResult> {
  const requested =
    data.owner.kind === 'new' ? { ...data.owner, ...(await newCredentials()) } : data.owner;

  let result: CreateEventResult;
  try {
    result = await auditedTransaction(async (tx, audit): Promise<CreateEventResult> => {
      // Checked before anything is written: returning early still commits the transaction.
      const taken = await tx.event.findUnique({ where: { slug: data.slug }, select: { id: true } });
      if (taken) return { ok: false, error: 'slug-taken', suggestion: data.slug };

      let owner: { id: string; email: string };
      if (requested.kind === 'existing') {
        const found = await tx.user.findFirst({
          where: {
            id: requested.userId,
            role: 'couple',
            OR: [{ banned: false }, { banned: null }],
          },
          select: { id: true, email: true },
        });
        if (!found) return { ok: false, error: 'owner-invalid' };
        owner = found;
      } else {
        const created = await insertCredentialUser(tx, {
          name: requested.name,
          email: requested.email,
          role: 'couple',
          passwordHash: requested.passwordHash,
        });
        if (!created) return { ok: false, error: 'email-taken' };
        owner = { id: created.id, email: requested.email };
        await audit({
          actorId: actor.id,
          action: 'user.create',
          target: { type: 'user', id: created.id },
          metadata: { label: requested.email, details: { name: requested.name, role: 'couple' } },
        });
      }

      const event = await tx.event.create({
        data: {
          ownerId: owner.id,
          slug: data.slug,
          phase: 'SAVE_THE_DATE',
          isActive: true,
          guestLimit: data.guestLimit,
          themeId: data.themeId,
          groomName: data.groomName,
          brideName: data.brideName,
          startsAt: data.startsAt,
          rsvpMode: 'FORM',
          sectionConfig: DEFAULT_SECTION_CONFIG.map((section) => ({ ...section })),
          guestRules: {
            createMany: {
              data: DEFAULT_GUEST_RULES.map((rule, position) => ({ ...rule, position })),
            },
          },
        },
        select: { id: true },
      });
      await audit({
        actorId: actor.id,
        action: 'event.create',
        target: { type: 'event', id: event.id },
        metadata: {
          label: coupleLabel(data),
          details: {
            slug: data.slug,
            owner: owner.email,
            newAccount: requested.kind === 'new',
            guestLimit: data.guestLimit,
          },
        },
      });

      return {
        ok: true,
        eventId: event.id,
        newAccount:
          requested.kind === 'new'
            ? { userId: owner.id, email: owner.email, password: requested.password }
            : null,
      };
    });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    // Another request took the slug or the e-mail between the checks and the insert.
    const slugTaken = await getPrisma().event.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    result = slugTaken
      ? { ok: false, error: 'slug-taken', suggestion: data.slug }
      : { ok: false, error: 'email-taken' };
  }
  if (!result.ok && result.error === 'slug-taken') {
    return { ...result, suggestion: await findFreeSlug(data.slug) };
  }
  return result;
}

async function newCredentials(): Promise<{ password: string; passwordHash: string }> {
  const password = generateTemporaryPassword();
  return { password, passwordHash: await hashPassword(password) };
}

// ── Changing ─────────────────────────────────────────────────────────────────

export type SetActiveResult = { ok: true } | { ok: false; error: 'not-found' };

/** Inactive events show "Convite não encontrado" to their guests (the cached copy is dropped). */
export async function setEventActive(
  actor: Actor,
  eventId: string,
  active: boolean,
): Promise<SetActiveResult> {
  const result = await auditedTransaction(
    async (
      tx,
      audit,
    ): Promise<{ ok: true; slug: string | null } | { ok: false; error: 'not-found' }> => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { slug: true, isActive: true, groomName: true, brideName: true },
      });
      if (!event) return { ok: false, error: 'not-found' };
      if (event.isActive === active) return { ok: true, slug: null };
      await tx.event.update({
        where: { id: eventId },
        data: { isActive: active },
        select: { id: true },
      });
      await audit({
        actorId: actor.id,
        action: active ? 'event.activate' : 'event.deactivate',
        target: { type: 'event', id: eventId },
        metadata: {
          label: coupleLabel(event),
          changes: { isActive: { from: !active, to: active } },
        },
      });
      return { ok: true, slug: event.slug };
    },
  );
  if (!result.ok) return result;
  if (result.slug) await invalidateInvitationEvent(result.slug);
  return { ok: true };
}

export type SetGuestLimitResult =
  | { ok: true }
  | { ok: false; error: 'not-found' }
  /** The event already has more guests than the new limit. */
  | { ok: false; error: 'limit-below-guests'; count: number };

/**
 * The event's plan. Never below the guests it already has: the event row is locked while counting,
 * like when guests are added, so a guest added at the same moment is counted.
 */
export async function setGuestLimit(
  actor: Actor,
  eventId: string,
  guestLimit: number,
): Promise<SetGuestLimitResult> {
  return auditedTransaction(async (tx, audit): Promise<SetGuestLimitResult> => {
    const locked = await lockEvent(tx, eventId);
    if (!locked) return { ok: false, error: 'not-found' };
    if (locked.guestLimit === guestLimit) return { ok: true };
    const count = await tx.guest.count({ where: { eventId } });
    if (guestLimit < count) return { ok: false, error: 'limit-below-guests', count };
    const event = await tx.event.update({
      where: { id: eventId },
      data: { guestLimit },
      select: { groomName: true, brideName: true },
    });
    await audit({
      actorId: actor.id,
      action: 'event.guest-limit',
      target: { type: 'event', id: eventId },
      metadata: {
        label: coupleLabel(event),
        changes: { guestLimit: { from: locked.guestLimit, to: guestLimit } },
      },
    });
    return { ok: true };
  });
}
