import { NextResponse, type NextRequest } from 'next/server';

import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/request-id';
import { buildContentSecurityPolicy, createNonce, NONCE_HEADER } from '@/lib/security/csp';

/**
 * Next.js 16 proxy (formerly "middleware"; always runs on the Node.js runtime).
 *
 * - Guarantees the `x-request-id` header on the forwarded request and on the response. The ID is
 *   normally assigned earlier, at the HTTP layer (`src/lib/observability/http-hooks.ts`), which also
 *   opens the AsyncLocalStorage context; this is the fallback when that hook is not active.
 * - Sets the Content-Security-Policy with a fresh nonce for every page render.
 *
 * Authorization is never decided only here: every Server Action and Route Handler re-checks it.
 */
export function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    upgradeInsecureRequests: process.env.APP_URL?.startsWith('https://') ?? false,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  requestHeaders.set(NONCE_HEADER, nonce);
  // Next.js reads the nonce from this request header and applies it to its own scripts.
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip API routes, static files, image optimization, the Sentry tunnel
      // (`/monitoring`, see next.config.ts) and public assets.
      source:
        '/((?!api/|_next/static|_next/image|monitoring|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp3|m4a|ogg|wav|txt|xml|woff2?)$).*)',
      // Prefetches return no HTML, so they need no CSP.
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
