/**
 * Content-Security-Policy with a per-request nonce (set by `proxy.ts`).
 *
 * A static CSP in next.config would have to allow inline scripts ('unsafe-inline') for Next.js's
 * hydration scripts, which removes most of the XSS protection. With a nonce, Next.js tags its own
 * scripts automatically; 'strict-dynamic' lets those scripts load the rest of the bundle.
 * Runtime-agnostic (Web Crypto only).
 */

export const NONCE_HEADER = 'x-nonce';

export interface CspOptions {
  nonce: string;
  isDev: boolean;
  /** Only when the site is served over https (breaks local http:// production runs otherwise). */
  upgradeInsecureRequests: boolean;
  /** Extra origins, e.g. object storage for presigned uploads and media (added in later phases). */
  connectSrc?: readonly string[];
  imgSrc?: readonly string[];
  mediaSrc?: readonly string[];
}

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function buildContentSecurityPolicy(options: CspOptions): string {
  const { nonce, isDev, connectSrc = [], imgSrc = [], mediaSrc = [] } = options;
  const directives: Record<string, readonly string[]> = {
    'default-src': ["'self'"],
    // React reconstructs server error stacks with eval() in development only.
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // React `style` attributes and Motion need inline styles. A nonce here would make browsers
    // ignore 'unsafe-inline', so styles intentionally have no nonce.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...imgSrc],
    'font-src': ["'self'", 'data:'],
    // Sentry events go through the same-origin tunnel route, so no external origin is needed.
    'connect-src': ["'self'", ...(isDev ? ['ws:', 'wss:'] : []), ...connectSrc],
    'media-src': ["'self'", 'blob:', ...mediaSrc],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'frame-src': ["'self'"],
    // 'self': the dashboard's live preview embeds invitation pages in a same-origin iframe.
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (options.upgradeInsecureRequests) policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}
