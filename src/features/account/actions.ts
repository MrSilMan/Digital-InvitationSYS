'use server';

import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';

import { logger } from '@/lib/logger';
import { changePasswordSchema } from '@/lib/validation/auth';
import { getAuth } from '@/server/auth/auth';
import { getSessionUser } from '@/server/auth/session';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

export type ChangePasswordErrorCode =
  'invalid' | 'wrong-password' | 'rate-limited' | 'unauthenticated' | 'unavailable';

export type ChangePasswordResult =
  | { ok: true }
  | {
      ok: false;
      error: ChangePasswordErrorCode;
      issues?: { path: string; message: string }[];
    };

/**
 * "A minha conta": the signed-in user changes their own password, typing the current one. Better
 * Auth checks it and stores the new hash; then every other session ends. This session is kept as
 * it is: Better Auth's own `revokeOtherSessions: true` replaces it too, and the page rendered with
 * the action's response would still carry the deleted cookie (sending the user to the login page).
 * Rate limited per user; never logs the passwords.
 */
export async function changePassword(input: unknown): Promise<ChangePasswordResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'unauthenticated' };
  const limit = await rateLimit(RATE_LIMITS.passwordChangesPerUser, user.id);
  if (!limit.allowed) {
    logger.warn('Password change rate limited', { userId: user.id });
    return { ok: false, error: 'rate-limited' };
  }
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  const auth = getAuth();
  const requestHeaders = await headers();
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      },
      headers: requestHeaders,
    });
    logger.info('Password changed', { userId: user.id });
  } catch (err) {
    if (isAPIError(err)) {
      const code = typeof err.body?.code === 'string' ? err.body.code : String(err.status);
      logger.info('Password change refused', { userId: user.id, reason: code });
      if (code === 'INVALID_PASSWORD') return { ok: false, error: 'wrong-password' };
      if (code === 'UNAUTHORIZED') return { ok: false, error: 'unauthenticated' };
      if (code === 'PASSWORD_TOO_SHORT' || code === 'PASSWORD_TOO_LONG') {
        return { ok: false, error: 'invalid' };
      }
    }
    logger.error('Password change failed', { err, userId: user.id });
    return { ok: false, error: 'unavailable' };
  }

  try {
    await auth.api.revokeOtherSessions({ headers: requestHeaders });
  } catch (err) {
    // The password did change; other devices stay signed in until their sessions expire.
    logger.error('Other sessions could not be ended after a password change', {
      err,
      userId: user.id,
    });
  }
  return { ok: true };
}
