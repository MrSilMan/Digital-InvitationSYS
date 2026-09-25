'use server';

import { z } from 'zod';

import { logger } from '@/lib/logger';
import { accountSchema, guestLimitSchema, newEventSchema } from '@/lib/validation/admin';
import { authorizeAdminAction } from '@/server/admin/access';
import {
  createCoupleAccount,
  resetPassword,
  setSuspended,
  updateAccount,
} from '@/server/admin/accounts';
import { createEvent, setEventActive, setGuestLimit } from '@/server/admin/events';
import type { SessionUser } from '@/server/auth/session';

import type {
  AdminActionError,
  AdminActionResult,
  AdminFieldIssue,
  TemporaryCredentials,
} from './types';

/**
 * The admin area's Server Actions. Nothing from the browser is trusted: each one checks the
 * session, the admin role, a rate limit and its input, then calls a service that records the
 * change in the audit log in the same transaction. Logs carry IDs, never passwords.
 */

const userIdSchema = z.string().regex(/^[A-Za-z0-9-]{1,64}$/);
const eventIdSchema = z.uuid();

function toIssues(error: z.ZodError): AdminFieldIssue[] {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

function invalid(error?: z.ZodError): AdminActionError {
  return { ok: false, error: 'invalid', ...(error ? { issues: toIssues(error) } : {}) };
}

/** Checks the admin, then runs the step; failures are logged and answered with "unavailable". */
async function asAdmin<R extends { ok: boolean }>(
  what: string,
  step: (user: SessionUser) => Promise<R>,
): Promise<R | AdminActionError> {
  const auth = await authorizeAdminAction();
  if (!auth.ok) return auth;
  try {
    return await step(auth.user);
  } catch (err) {
    logger.error(`Admin ${what} failed`, { err, userId: auth.user.id });
    return { ok: false, error: 'unavailable' };
  }
}

// ── Accounts ─────────────────────────────────────────────────────────────────

/** A couple account; the temporary password comes back once. */
export async function addAccount(
  input: unknown,
): Promise<AdminActionResult<{ userId: string; credentials: TemporaryCredentials }>> {
  return asAdmin('account creation', async (admin) => {
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const created = await createCoupleAccount(admin, parsed.data);
    if (!created.ok) return created;
    return {
      ok: true,
      userId: created.userId,
      credentials: { email: parsed.data.email, password: created.password },
    };
  });
}

export async function editAccount(userId: unknown, input: unknown): Promise<AdminActionResult> {
  return asAdmin('account update', async (admin) => {
    const id = userIdSchema.safeParse(userId);
    if (!id.success) return invalid();
    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return updateAccount(admin, id.data, parsed.data);
  });
}

/** A new temporary password for someone else's account (it ends their sessions). */
export async function issueTemporaryPassword(
  userId: unknown,
): Promise<AdminActionResult<{ credentials: TemporaryCredentials }>> {
  return asAdmin('password reset', async (admin) => {
    const id = userIdSchema.safeParse(userId);
    if (!id.success) return invalid();
    const reset = await resetPassword(admin, id.data);
    if (!reset.ok) return reset;
    return { ok: true, credentials: { email: reset.email, password: reset.password } };
  });
}

export async function changeAccountSuspension(
  userId: unknown,
  suspended: unknown,
): Promise<AdminActionResult> {
  return asAdmin('suspension change', async (admin) => {
    const id = userIdSchema.safeParse(userId);
    const flag = z.boolean().safeParse(suspended);
    if (!id.success || !flag.success) return invalid();
    return setSuspended(admin, id.data, flag.data);
  });
}

// ── Events ───────────────────────────────────────────────────────────────────

/** A new event (and, if asked, its couple's account with a temporary password). */
export async function addEvent(
  input: unknown,
): Promise<AdminActionResult<{ eventId: string; credentials: TemporaryCredentials | null }>> {
  return asAdmin('event creation', async (admin) => {
    const parsed = newEventSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const created = await createEvent(admin, parsed.data);
    if (!created.ok) return created;
    return {
      ok: true,
      eventId: created.eventId,
      credentials: created.newAccount
        ? { email: created.newAccount.email, password: created.newAccount.password }
        : null,
    };
  });
}

/** Turns the event on or off for its guests. */
export async function changeEventStatus(
  eventId: unknown,
  active: unknown,
): Promise<AdminActionResult> {
  return asAdmin('event status change', async (admin) => {
    const id = eventIdSchema.safeParse(eventId);
    const flag = z.boolean().safeParse(active);
    if (!id.success || !flag.success) return invalid();
    return setEventActive(admin, id.data, flag.data);
  });
}

export async function changeGuestLimit(
  eventId: unknown,
  guestLimit: unknown,
): Promise<AdminActionResult> {
  return asAdmin('guest limit change', async (admin) => {
    const id = eventIdSchema.safeParse(eventId);
    if (!id.success) return invalid();
    const limit = guestLimitSchema.safeParse(guestLimit);
    if (!limit.success) {
      const issues = limit.error.issues.map((issue) => ({
        path: 'guestLimit',
        message: issue.message,
      }));
      return { ok: false, error: 'invalid', issues } satisfies AdminActionError;
    }
    return setGuestLimit(admin, id.data, limit.data);
  });
}
