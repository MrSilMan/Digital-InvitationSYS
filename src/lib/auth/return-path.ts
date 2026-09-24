/**
 * Where to go after signing in (the `voltar` query parameter). Only paths inside the signed-in
 * areas are accepted, so a crafted link can never send someone to another site.
 */

export const DEFAULT_RETURN_PATH = '/painel';

const ALLOWED_PREFIXES = ['/painel', '/admin'];

export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }
  let url: URL;
  try {
    url = new URL(value, 'http://return.invalid');
  } catch {
    return DEFAULT_RETURN_PATH;
  }
  if (url.origin !== 'http://return.invalid') return DEFAULT_RETURN_PATH;
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  return allowed ? `${url.pathname}${url.search}` : DEFAULT_RETURN_PATH;
}
