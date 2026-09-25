import { randomInt } from 'node:crypto';

import { hashPassword as scryptHash, verifyPassword as scryptVerify } from 'better-auth/crypto';

/**
 * Password hashing for e-mail + password logins. Better Auth is configured with these same
 * functions (src/server/auth/auth.ts), and the admin area, the seed and `npm run admin:create`
 * write account passwords with them, so every path agrees on the format (scrypt).
 *
 * No 'server-only' marker: the command-line scripts use it too. It never reaches the browser.
 */

export function hashPassword(password: string): Promise<string> {
  return scryptHash(password);
}

export function verifyPassword(data: { hash: string; password: string }): Promise<boolean> {
  return scryptVerify(data);
}

/** No 0/o, 1/l/i: read aloud or typed from a WhatsApp message without mistakes. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const GROUPS = 3;
const GROUP_LENGTH = 4;

/**
 * A temporary password the admin passes on to the couple (e.g. "k7mq-9xrt-2hpd"): 12 random
 * characters (about 59 bits), from a cryptographically secure generator. Couples change it in
 * "A minha conta".
 */
export function generateTemporaryPassword(): string {
  const groups: string[] = [];
  for (let group = 0; group < GROUPS; group += 1) {
    let text = '';
    for (let index = 0; index < GROUP_LENGTH; index += 1) {
      text += ALPHABET[randomInt(ALPHABET.length)];
    }
    groups.push(text);
  }
  return groups.join('-');
}
