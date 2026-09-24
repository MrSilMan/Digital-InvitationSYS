/**
 * Guest tokens: the secret part of each personal invitation link (/c/<slug>/<token>).
 *
 * 16 bytes from the Web Crypto CSPRNG, base64url-encoded: 22 URL-safe characters, 128 bits of
 * entropy — unguessable, and short enough for WhatsApp messages. Runtime-agnostic.
 */

export const GUEST_TOKEN_BYTES = 16;
export const GUEST_TOKEN_LENGTH = 22;

/** What a well-formed token looks like (also enforced by a database CHECK constraint). */
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createGuestToken(): string {
  const bytes = new Uint8Array(GUEST_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** Cheap format check before any database lookup (rejects probing with malformed paths). */
export function isGuestToken(value: unknown): value is string {
  return typeof value === 'string' && GUEST_TOKEN_PATTERN.test(value);
}
