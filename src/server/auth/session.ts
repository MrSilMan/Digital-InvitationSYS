import 'server-only';

import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { toUserRole, type UserRole } from '@/lib/auth/roles';
import { setRequestUser } from '@/lib/request-context';

import { getAuth } from './auth';

/**
 * Data access layer for sessions: every page, Server Action and Route Handler of the signed-in
 * areas asks here who is signed in. `proxy.ts` only redirects visitors without a session cookie
 * (an optimistic check); the real check is this one.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** The signed-in user of this request, or null. Read once per request (React `cache`). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const user: SessionUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: toUserRole(session.user.role),
  };
  setRequestUser(user.id);
  // ID and role only: never the e-mail or the name (src/lib/sentry/options.ts).
  Sentry.setUser({ id: user.id, role: user.role });
  return user;
});

/** Pages: the signed-in user, or the login page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/entrar');
  return user;
}

/** Couples reach their own events; admins every event. */
export function canAccessEvent(user: Pick<SessionUser, 'id' | 'role'>, ownerId: string): boolean {
  return user.role === 'admin' || ownerId === user.id;
}
