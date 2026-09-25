'use server';

import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { defaultReturnPath, parseReturnPath } from '@/lib/auth/return-path';
import { toUserRole } from '@/lib/auth/roles';
import { clientIp } from '@/lib/client-ip';
import { logger } from '@/lib/logger';
import { loginSchema } from '@/lib/validation/auth';
import { getAuth } from '@/server/auth/auth';
import { hashKeyPart } from '@/server/cache/json-cache';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

export type SignInErrorCode =
  'invalid' | 'invalid-credentials' | 'rate-limited' | 'suspended' | 'unavailable';

/**
 * Only returns on failure: a successful login redirects to `returnTo`, or without one to the
 * dashboard (couples) or the admin area (admins).
 */
export type SignInResult = { ok: false; error: SignInErrorCode };

/**
 * E-mail + password login. Rate limited per IP and per e-mail address (hashed); every outcome is
 * logged without the address (a hash correlates repeated attempts on one account).
 */
export async function signIn(input: unknown, returnTo?: unknown): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const { email, password } = parsed.data;
  const emailHash = hashKeyPart(email);

  const requestHeaders = await headers();
  const [perIp, perEmail] = await Promise.all([
    rateLimit(RATE_LIMITS.loginPerIp, clientIp(requestHeaders)),
    rateLimit(RATE_LIMITS.loginPerEmail, email),
  ]);
  if (!perIp.allowed || !perEmail.allowed) {
    logger.warn('Login rate limited', { emailHash, limit: perIp.allowed ? 'email' : 'ip' });
    return { ok: false, error: 'rate-limited' };
  }

  let destination: string;
  try {
    const result = await getAuth().api.signInEmail({
      body: { email, password, rememberMe: true },
      headers: requestHeaders,
    });
    logger.info('Login succeeded', { userId: result.user.id });
    destination = parseReturnPath(returnTo) ?? defaultReturnPath(toUserRole(result.user.role));
  } catch (err) {
    if (isAPIError(err)) {
      const code = typeof err.body?.code === 'string' ? err.body.code : String(err.status);
      logger.info('Login failed', { emailHash, reason: code });
      return { ok: false, error: code === 'BANNED_USER' ? 'suspended' : 'invalid-credentials' };
    }
    logger.error('Login failed unexpectedly', { err, emailHash });
    return { ok: false, error: 'unavailable' };
  }

  redirect(destination);
}

/** Ends the session (database row and cookie) and returns to the login page. */
export async function signOut(): Promise<void> {
  const requestHeaders = await headers();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session) {
    await auth.api.signOut({ headers: requestHeaders });
    logger.info('Logout', { userId: session.user.id });
  }
  redirect('/entrar');
}
