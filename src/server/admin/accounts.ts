import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import type { AccountData } from '@/lib/validation/admin';
import { auditedTransaction } from '@/server/audit/audit-log';
import { insertCredentialUser, replacePassword } from '@/server/auth/credentials';
import { generateTemporaryPassword, hashPassword } from '@/server/auth/passwords';

/**
 * Accounts, as the admin area changes them. Rows are written the way Better Auth writes them
 * (user + "credential" account with the scrypt hash; a suspension = the admin plugin's `banned`
 * flag with the sessions deleted), inside the transaction that records the audit entry. The
 * integration tests sign in through Better Auth after every change to prove it agrees.
 */

export interface Actor {
  id: string;
}

const SUSPENSION_REASON = 'Suspensa na administração';

/** A unique constraint refused the write (two requests creating the same e-mail or slug). */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

// ── Creating ─────────────────────────────────────────────────────────────────

export type CreateAccountResult =
  { ok: true; userId: string; password: string } | { ok: false; error: 'email-taken' };

/** A couple account with a temporary password (returned once, to be passed on by the admin). */
export async function createCoupleAccount(
  actor: Actor,
  data: AccountData,
): Promise<CreateAccountResult> {
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  try {
    return await auditedTransaction(async (tx, audit): Promise<CreateAccountResult> => {
      const created = await insertCredentialUser(tx, { ...data, role: 'couple', passwordHash });
      if (!created) return { ok: false, error: 'email-taken' };
      await audit({
        actorId: actor.id,
        action: 'user.create',
        target: { type: 'user', id: created.id },
        metadata: { label: data.email, details: { name: data.name, role: 'couple' } },
      });
      return { ok: true, userId: created.id, password };
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: 'email-taken' };
    throw err;
  }
}

// ── Changing ─────────────────────────────────────────────────────────────────

export type UpdateAccountResult = { ok: true } | { ok: false; error: 'not-found' | 'email-taken' };

/** A new name and/or e-mail (the login changes with the e-mail). */
export async function updateAccount(
  actor: Actor,
  userId: string,
  data: AccountData,
): Promise<UpdateAccountResult> {
  try {
    return await auditedTransaction(async (tx, audit): Promise<UpdateAccountResult> => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (!user) return { ok: false, error: 'not-found' };
      const changes: Record<string, { from: string; to: string }> = {};
      if (user.name !== data.name) changes.name = { from: user.name, to: data.name };
      if (user.email !== data.email) {
        const taken = await tx.user.findUnique({
          where: { email: data.email },
          select: { id: true },
        });
        if (taken) return { ok: false, error: 'email-taken' };
        changes.email = { from: user.email, to: data.email };
      }
      if (Object.keys(changes).length === 0) return { ok: true };
      await tx.user.update({ where: { id: userId }, data, select: { id: true } });
      await audit({
        actorId: actor.id,
        action: 'user.update',
        target: { type: 'user', id: userId },
        metadata: { label: data.email, changes },
      });
      return { ok: true };
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: 'email-taken' };
    throw err;
  }
}

export type ResetPasswordResult =
  { ok: true; password: string; email: string } | { ok: false; error: 'not-found' | 'own-account' };

/**
 * A new temporary password: the old one stops working and every session ends. Admins change
 * their own password in "A minha conta" (it asks for the current one).
 */
export async function resetPassword(actor: Actor, userId: string): Promise<ResetPasswordResult> {
  if (userId === actor.id) return { ok: false, error: 'own-account' };
  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  return auditedTransaction(async (tx, audit): Promise<ResetPasswordResult> => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return { ok: false, error: 'not-found' };
    const sessionsEnded = await replacePassword(tx, userId, passwordHash);
    await audit({
      actorId: actor.id,
      action: 'user.password-reset',
      target: { type: 'user', id: userId },
      metadata: { label: user.email, details: { sessionsEnded } },
    });
    return { ok: true, password, email: user.email };
  });
}

export type SuspensionResult =
  { ok: true } | { ok: false; error: 'not-found' | 'own-account' | 'last-admin' };

/**
 * Suspends an account (it cannot sign in; its sessions end at once) or lifts the suspension. The
 * account's events stay as they are. Nobody suspends their own account, and one admin at least
 * stays active.
 */
export async function setSuspended(
  actor: Actor,
  userId: string,
  suspended: boolean,
): Promise<SuspensionResult> {
  if (userId === actor.id) return { ok: false, error: 'own-account' };
  return auditedTransaction(async (tx, audit): Promise<SuspensionResult> => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true, banned: true },
    });
    if (!user) return { ok: false, error: 'not-found' };
    if (Boolean(user.banned) === suspended) return { ok: true };

    if (suspended && user.role === 'admin') {
      // Admins suspending each other at the same moment take turns here.
      await tx.$queryRaw`SELECT "id" FROM "user" WHERE "role" = 'admin' FOR UPDATE`;
      const otherActiveAdmins = await tx.user.count({
        where: {
          role: 'admin',
          id: { not: userId },
          OR: [{ banned: false }, { banned: null }],
        },
      });
      if (otherActiveAdmins === 0) return { ok: false, error: 'last-admin' };
    }

    await tx.user.update({
      where: { id: userId },
      data: suspended
        ? { banned: true, banReason: SUSPENSION_REASON, banExpires: null }
        : { banned: false, banReason: null, banExpires: null },
      select: { id: true },
    });
    const sessionsEnded = suspended
      ? (await tx.session.deleteMany({ where: { userId } })).count
      : 0;
    await audit({
      actorId: actor.id,
      action: suspended ? 'user.suspend' : 'user.unsuspend',
      target: { type: 'user', id: userId },
      metadata: { label: user.email, ...(suspended ? { details: { sessionsEnded } } : {}) },
    });
    return { ok: true };
  });
}
