import 'server-only';

import { notFound } from 'next/navigation';

import { logger } from '@/lib/logger';
import { getSessionUser, requireUser, type SessionUser } from '@/server/auth/session';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

/**
 * Who may use the admin area: admins only. Couples get the same "not found" as a missing page,
 * so the area is never advertised. `proxy.ts` only sends visitors without a session cookie to the
 * login page; every page and Server Action of the area checks again here.
 */

/** Pages: the signed-in admin, or the login page / "not found". */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') notFound();
  return user;
}

export type AdminActionAuth =
  | { ok: true; user: SessionUser }
  | { ok: false; error: 'unauthenticated' | 'not-found' | 'rate-limited' };

/** Server Actions: a signed-in admin within the rate limit. */
export async function authorizeAdminAction(): Promise<AdminActionAuth> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'unauthenticated' };
  if (user.role !== 'admin') {
    logger.warn('Admin action refused', { userId: user.id });
    return { ok: false, error: 'not-found' };
  }
  const limit = await rateLimit(RATE_LIMITS.adminActionsPerUser, user.id);
  if (!limit.allowed) return { ok: false, error: 'rate-limited' };
  return { ok: true, user };
}
