import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';

import { getAuth } from '@/server/auth/auth';

import type { TestPrisma } from './db';

/** Signs in through Better Auth and returns the session cookie for later requests. */
export async function sessionCookie(email: string, password: string): Promise<string> {
  const response = await getAuth().api.signInEmail({ body: { email, password }, asResponse: true });
  const setCookie = response.headers.get('set-cookie') ?? '';
  const cookie = /(?:__Secure-)?convites\.session_token=[^;]+/.exec(setCookie)?.[0];
  if (!cookie) throw new Error(`No session cookie for ${email}`);
  return cookie;
}

/** A couple account with an e-mail + password login (and no events). */
export async function createCouple(
  prisma: TestPrisma,
  user: { name: string; email: string; password: string },
): Promise<string> {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      name: user.name,
      email: user.email,
      role: 'couple',
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: 'credential',
          password: await hashPassword(user.password),
        },
      },
    },
  });
  return id;
}
