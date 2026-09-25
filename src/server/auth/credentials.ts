import { randomUUID } from 'node:crypto';

import type { Prisma } from '@/generated/prisma/client';
import type { UserRole } from '@/lib/auth/roles';

/**
 * E-mail + password accounts written straight to the database, the way Better Auth writes them
 * (a user, and a "credential" account holding the hash from ./passwords.ts). Used inside the admin
 * area's transactions and by `npm run admin:create`, so no 'server-only' marker or logger here.
 */

type Tx = Prisma.TransactionClient;

/** Creates a user with an e-mail + password login; null when the e-mail is already in use. */
export async function insertCredentialUser(
  tx: Tx,
  user: { name: string; email: string; role: UserRole; passwordHash: string },
): Promise<{ id: string } | null> {
  const existing = await tx.user.findUnique({ where: { email: user.email }, select: { id: true } });
  if (existing) return null;
  const id = randomUUID();
  await tx.user.create({
    data: {
      id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          password: user.passwordHash,
        },
      },
    },
    select: { id: true },
  });
  return { id };
}

/**
 * Replaces the user's password (adding the credential account if missing) and ends every session.
 * Returns how many sessions ended.
 */
export async function replacePassword(
  tx: Tx,
  userId: string,
  passwordHash: string,
): Promise<number> {
  const updated = await tx.account.updateMany({
    where: { userId, providerId: 'credential' },
    data: { password: passwordHash },
  });
  if (updated.count === 0) {
    await tx.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
      },
    });
  }
  const { count } = await tx.session.deleteMany({ where: { userId } });
  return count;
}
