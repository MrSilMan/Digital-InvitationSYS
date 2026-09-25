import type { UserRole } from './roles';

/**
 * Where to go after signing in (the `voltar` query parameter). Only paths inside the signed-in
 * areas are accepted, so a crafted link can never send someone to another site.
 */

export const DEFAULT_RETURN_PATH = '/painel';

const ALLOWED_PREFIXES = ['/painel', '/admin'];

/** The `voltar` value as a path of ours; null when it is missing or refused. */
export function parseReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  let url: URL;
  try {
    url = new URL(value, 'http://return.invalid');
  } catch {
    return null;
  }
  if (url.origin !== 'http://return.invalid') return null;
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  return allowed ? `${url.pathname}${url.search}` : null;
}

export function safeReturnPath(value: unknown): string {
  return parseReturnPath(value) ?? DEFAULT_RETURN_PATH;
}

/** Without a (valid) `voltar`: couples go to their dashboard, admins to the admin area. */
export function defaultReturnPath(role: UserRole): string {
  return role === 'admin' ? '/admin' : DEFAULT_RETURN_PATH;
}
