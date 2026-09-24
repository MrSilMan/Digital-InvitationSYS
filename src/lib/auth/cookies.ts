/** Session cookies are named `convites.session_token` (`__Secure-` prefixed over https). */
export const AUTH_COOKIE_PREFIX = 'convites';

/** Areas that need a signed-in user: `proxy.ts` sends visitors without a session to the login. */
export const SIGNED_IN_PREFIXES = ['/painel', '/previsualizar', '/admin'] as const;

export function isSignedInArea(pathname: string): boolean {
  return SIGNED_IN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
