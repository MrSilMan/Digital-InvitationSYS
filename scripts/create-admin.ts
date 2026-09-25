/**
 * Creates an admin account, or makes an existing account an admin:
 *
 *   npm run admin:create -- --email=ana@exemplo.ao --name="Ana Silva"
 *   npm run admin:create -- --email=ana@exemplo.ao --new-password   (existing account: new password)
 *
 * This is how the first real admin gets in (the seed only makes demo logins). A new account gets a
 * generated password, printed once; an existing one keeps its password unless --new-password is
 * given (which also ends its sessions). Suspended accounts are reactivated. Every change is written
 * to the audit log without an actor ("via: cli"), in the same transaction.
 *
 * Reads DATABASE_URL from the environment or the .env files, like the app.
 */
import { parseArgs } from 'node:util';

import { loadEnvConfig } from '@next/env';

import { emailSchema } from '@/lib/validation/auth';
import { collapseSpaces } from '@/lib/validation/guest';
import { recordAudit } from '@/server/audit/record';
import { insertCredentialUser, replacePassword } from '@/server/auth/credentials';
import { generateTemporaryPassword, hashPassword } from '@/server/auth/passwords';
import { createPrismaClient } from '@/server/db/client';

const USAGE =
  'Usage: npm run admin:create -- --email=<e-mail> [--name="<name>"] [--new-password]\n' +
  '  --name is required when the account does not exist yet.';

const NAME_MAX_LENGTH = 80;

class UsageError extends Error {}

type Outcome =
  | { kind: 'created'; password: string }
  | { kind: 'promoted'; password: string | null }
  | { kind: 'unchanged' };

async function main(): Promise<void> {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      'new-password': { type: 'boolean', default: false },
    },
    strict: true,
  });
  const email = emailSchema.safeParse(values.email ?? '');
  if (!email.success) throw new UsageError('A valid --email is required.');
  const name = collapseSpaces(values.name ?? '');
  if (name.length > NAME_MAX_LENGTH) {
    throw new UsageError(`--name can have at most ${NAME_MAX_LENGTH} characters.`);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new UsageError('DATABASE_URL is not set (see .env.example).');

  const password = generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  const prisma = createPrismaClient({
    connectionString: databaseUrl,
    applicationName: 'convites-admin-cli',
    maxConnections: 1,
  });

  try {
    const outcome = await prisma.$transaction(async (tx): Promise<Outcome> => {
      const existing = await tx.user.findUnique({
        where: { email: email.data },
        select: { id: true, role: true, banned: true },
      });

      if (!existing) {
        if (!name) throw new UsageError('--name is required for a new account.');
        const created = await insertCredentialUser(tx, {
          name,
          email: email.data,
          role: 'admin',
          passwordHash,
        });
        if (!created) throw new Error('The account appeared while it was being created.');
        await recordAudit(tx, {
          actorId: null,
          action: 'user.create',
          target: { type: 'user', id: created.id },
          metadata: { label: email.data, details: { name, role: 'admin', via: 'cli' } },
        });
        return { kind: 'created', password };
      }

      const resetPassword = values['new-password'] === true;
      if (existing.role === 'admin' && existing.banned !== true && !resetPassword) {
        return { kind: 'unchanged' };
      }
      await tx.user.update({
        where: { id: existing.id },
        data: { role: 'admin', banned: false, banReason: null, banExpires: null },
        select: { id: true },
      });
      const sessionsEnded = resetPassword
        ? await replacePassword(tx, existing.id, passwordHash)
        : 0;
      await recordAudit(tx, {
        actorId: null,
        action: resetPassword && existing.role === 'admin' ? 'user.password-reset' : 'user.promote',
        target: { type: 'user', id: existing.id },
        metadata: {
          label: email.data,
          changes: {
            ...(existing.role === 'admin' ? {} : { role: { from: existing.role, to: 'admin' } }),
            ...(existing.banned === true ? { suspended: { from: true, to: false } } : {}),
          },
          details: { via: 'cli', ...(resetPassword ? { sessionsEnded } : {}) },
        },
      });
      return { kind: 'promoted', password: resetPassword ? password : null };
    });

    switch (outcome.kind) {
      case 'created':
        console.log(`\nAdmin account created: ${email.data}`);
        console.log(`Temporary password (shown once): ${outcome.password}`);
        console.log('Sign in at /entrar and change it in "A minha conta".\n');
        break;
      case 'promoted':
        console.log(`\n${email.data} is now an active admin.`);
        if (outcome.password) {
          console.log(`New temporary password (shown once): ${outcome.password}`);
        }
        console.log('');
        break;
      case 'unchanged':
        console.log(`\n${email.data} is already an active admin: nothing changed.\n`);
        break;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(`${error.message}\n${USAGE}`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
