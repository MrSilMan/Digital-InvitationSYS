import 'server-only';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

import { getServerEnv } from '@/env';
import { AUTH_COOKIE_PREFIX } from '@/lib/auth/cookies';
import { logger } from '@/lib/logger';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/validation/auth';
import { getPrisma } from '@/server/db/prisma';

import { hashPassword, verifyPassword } from './passwords';

/**
 * Better Auth: e-mail + password logins, database sessions and the `couple` / `admin` roles
 * (admin plugin). Accounts are created in the admin area: there is no public sign-up. The admin
 * area writes users, passwords and suspensions straight to the database, in the transaction that
 * records the audit entry (src/server/admin/accounts.ts), with the same password functions.
 *
 * Logins go through our Server Actions (src/features/auth/actions.ts), which validate the input,
 * apply our Redis rate limits and log the outcome; `auth.api` calls skip Better Auth's own rate
 * limiter. Its HTTP handler is not mounted at all; `disabledPaths` keeps sign-in and sign-up off
 * even if it is mounted later for another feature (e.g. password-reset links).
 */

const DAY = 24 * 60 * 60;

/** Admins get the admin plugin's user and session management; couples none of it. */
const accessControl = createAccessControl(defaultStatements);
const roles = {
  admin: accessControl.newRole(adminAc.statements),
  couple: accessControl.newRole({ user: [], session: [] }),
};

function createAuth() {
  const env = getServerEnv();
  return betterAuth({
    appName: 'Convites Digitais',
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    database: prismaAdapter(getPrisma(), { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      autoSignIn: false,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    session: { expiresIn: 30 * DAY, updateAge: DAY },
    disabledPaths: ['/sign-in/email', '/sign-up/email'],
    advanced: { cookiePrefix: AUTH_COOKIE_PREFIX },
    logger: {
      level: 'warn',
      log: (level, message, ...args) => {
        const logLevel = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'debug';
        logger.log(logLevel, `Better Auth: ${message}`, args.length > 0 ? { args } : {});
      },
    },
    plugins: [
      admin({ defaultRole: 'couple', adminRoles: ['admin'], ac: accessControl, roles }),
      // Sets the session cookie from Server Actions; must stay the last plugin.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const AUTH_KEY = Symbol.for('convites.auth');
type GlobalWithAuth = typeof globalThis & { [AUTH_KEY]?: Auth };

/** One instance per process, created on first use (`next build` needs no database or secret). */
export function getAuth(): Auth {
  const g = globalThis as GlobalWithAuth;
  g[AUTH_KEY] ??= createAuth();
  return g[AUTH_KEY];
}
