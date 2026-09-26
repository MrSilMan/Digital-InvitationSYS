import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { confirmsAccount, confirmsEvent } from '@/lib/admin/confirmation';
import { toUserRole } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';
import { auditedTransaction, type RecordInTransaction } from '@/server/audit/audit-log';
import { deletePreviewDraft } from '@/server/events/editor';
import { lockEvent } from '@/server/guests/service';
import {
  invalidateInvitationEvent,
  invalidateInvitationGuests,
} from '@/server/invitations/queries';
import { discardStoredFiles, type StoredMedia } from '@/server/media/files';

import type { Actor } from './accounts';

/**
 * Deleting events and accounts for good, from the admin area. The rows go in one transaction with
 * their audit entries: an event takes its guests (answers, views), media rows, imports, places and
 * programme with it (ON DELETE CASCADE); an account takes its sessions and login, and its events
 * are deleted first, one by one (the schema never lets a user's deletion take events implicitly).
 * Outside the database, after the commit: the stored files, cached pages and preview drafts.
 */

type Tx = Prisma.TransactionClient;

const eventToDeleteSelect = {
  id: true,
  slug: true,
  groomName: true,
  brideName: true,
  ownerId: true,
  owner: { select: { email: true } },
} satisfies Prisma.EventSelect;

type EventToDelete = Prisma.EventGetPayload<{ select: typeof eventToDeleteSelect }>;

/** What an event leaves to clean up outside the database once its rows are gone. */
interface DeletedEvent {
  id: string;
  slug: string;
  ownerId: string;
  guestTokens: string[];
  media: StoredMedia[];
}

/**
 * Deletes one event inside the caller's transaction and records it. The event row is locked
 * first: a guest or an upload added meanwhile waits, then fails, so none is missed.
 */
async function deleteEventRows(
  tx: Tx,
  audit: RecordInTransaction,
  actor: Actor,
  event: EventToDelete,
): Promise<DeletedEvent> {
  await lockEvent(tx, event.id);
  const guests = await tx.guest.findMany({ where: { eventId: event.id }, select: { token: true } });
  const media = await tx.media.findMany({
    where: { eventId: event.id },
    select: { id: true, eventId: true, originalKey: true },
  });
  await tx.event.delete({ where: { id: event.id }, select: { id: true } });
  await audit({
    actorId: actor.id,
    action: 'event.delete',
    target: { type: 'event', id: event.id },
    metadata: {
      label: `${event.groomName} & ${event.brideName}`,
      details: {
        slug: event.slug,
        owner: event.owner.email,
        guests: guests.length,
        media: media.length,
      },
    },
  });
  return {
    id: event.id,
    slug: event.slug,
    ownerId: event.ownerId,
    guestTokens: guests.map((guest) => guest.token),
    media,
  };
}

/**
 * After the commit: the files (through the queue), the cached copies of the invitation and its
 * guests, and the preview drafts of the owner and the admin. The rows are already gone, so a
 * failure here is logged, never thrown.
 */
async function cleanUpDeletedEvents(events: readonly DeletedEvent[], actor: Actor): Promise<void> {
  for (const event of events) {
    try {
      await discardStoredFiles(event.media);
      await invalidateInvitationEvent(event.slug);
      await invalidateInvitationGuests(event.guestTokens);
      await deletePreviewDraft(event.id, event.ownerId);
      if (actor.id !== event.ownerId) await deletePreviewDraft(event.id, actor.id);
    } catch (err) {
      logger.error('Clean-up after an event deletion failed', { err, eventId: event.id });
    }
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

export type DeleteEventResult = { ok: true } | { ok: false; error: 'not-found' | 'confirmation' };

/** Deletes an event; `confirmation` is its address, as the admin typed it. */
export async function deleteEvent(
  actor: Actor,
  eventId: string,
  confirmation: string,
): Promise<DeleteEventResult> {
  const result = await auditedTransaction(async (tx, audit) => {
    if (!(await lockEvent(tx, eventId))) return { ok: false, error: 'not-found' } as const;
    const event = await tx.event.findUniqueOrThrow({
      where: { id: eventId },
      select: eventToDeleteSelect,
    });
    // Checked before anything is written: returning early still commits the transaction.
    if (!confirmsEvent(confirmation, event.slug)) {
      return { ok: false, error: 'confirmation' } as const;
    }
    return { ok: true, deleted: await deleteEventRows(tx, audit, actor, event) } as const;
  });
  if (!result.ok) return result;
  await cleanUpDeletedEvents([result.deleted], actor);
  return { ok: true };
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export type DeleteAccountResult =
  | { ok: true; events: number }
  | { ok: false; error: 'not-found' | 'own-account' | 'last-admin' | 'confirmation' };

/**
 * Deletes an account and its events; `confirmation` is its e-mail, as the admin typed it. Its
 * sessions end at once. Nobody deletes their own account, and one active admin always remains.
 * The audit entries it wrote stay, without their author.
 */
export async function deleteAccount(
  actor: Actor,
  userId: string,
  confirmation: string,
): Promise<DeleteAccountResult> {
  if (userId === actor.id) return { ok: false, error: 'own-account' };
  const result = await auditedTransaction(async (tx, audit) => {
    // Locked: an event given to this account meanwhile waits, then fails (the account is gone).
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`;
    if (locked.length === 0) return { ok: false, error: 'not-found' } as const;
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, role: true },
    });
    if (!confirmsAccount(confirmation, user.email)) {
      return { ok: false, error: 'confirmation' } as const;
    }
    const role = toUserRole(user.role);
    if (role === 'admin') {
      // Admins deleting or suspending each other at the same moment take turns here.
      await tx.$queryRaw`SELECT "id" FROM "user" WHERE "role" = 'admin' FOR UPDATE`;
      const otherActiveAdmins = await tx.user.count({
        where: { role: 'admin', id: { not: userId }, OR: [{ banned: false }, { banned: null }] },
      });
      if (otherActiveAdmins === 0) return { ok: false, error: 'last-admin' } as const;
    }

    const events = await tx.event.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: eventToDeleteSelect,
    });
    const deleted: DeletedEvent[] = [];
    for (const event of events) deleted.push(await deleteEventRows(tx, audit, actor, event));
    await tx.user.delete({ where: { id: userId }, select: { id: true } });
    await audit({
      actorId: actor.id,
      action: 'user.delete',
      target: { type: 'user', id: userId },
      metadata: { label: user.email, details: { name: user.name, role, events: events.length } },
    });
    return { ok: true, deleted } as const;
  });
  if (!result.ok) return result;
  await cleanUpDeletedEvents(result.deleted, actor);
  return { ok: true, events: result.deleted.length };
}
