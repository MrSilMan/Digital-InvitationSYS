import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

import { getServerEnv } from '@/env';
import { AUTH_COOKIE_PREFIX, isSignedInArea } from '@/lib/auth/cookies';
import { isBotUserAgent } from '@/lib/bots';
import { clientIp } from '@/lib/client-ip';
import { uploadOrigin } from '@/lib/media/upload-origin';
import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/request-id';
import { buildContentSecurityPolicy, createNonce, NONCE_HEADER } from '@/lib/security/csp';
import { tooManyRequestsResponse } from '@/lib/security/too-many-requests';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

/**
 * Next.js 16 proxy (formerly "middleware"; always runs on the Node.js runtime).
 *
 * - Guarantees the `x-request-id` header on the forwarded request and on the response. The ID is
 *   normally assigned earlier, at the HTTP layer (`src/lib/observability/http-hooks.ts`), which also
 *   opens the AsyncLocalStorage context; this is the fallback when that hook is not active.
 * - Rate-limits guest invitation pages per IP (link-preview bots exempt; allowed without Redis).
 * - Sends visitors without a session cookie from the signed-in areas to the login page.
 * - Sets the Content-Security-Policy with a fresh nonce for every page render.
 *
 * Authorization is never decided only here: the cookie is not validated (that would cost a
 * database query per request), so every page, Server Action and Route Handler re-checks the session
 * (src/server/auth/session.ts).
 */
/** Where browsers upload to. The server validated the environment at startup; tests may lack it. */
function storageOrigins(): string[] {
  try {
    return [uploadOrigin(getServerEnv())];
  } catch {
    return [];
  }
}

export async function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
  const { pathname, search } = request.nextUrl;

  if (
    isSignedInArea(pathname) &&
    !getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })
  ) {
    const login = new URL('/entrar', request.url);
    login.searchParams.set('voltar', `${pathname}${search}`);
    const response = NextResponse.redirect(login);
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  if (
    request.nextUrl.pathname.startsWith('/c/') &&
    !isBotUserAgent(request.headers.get('user-agent'))
  ) {
    const limit = await rateLimit(RATE_LIMITS.invitationPagesPerIp, clientIp(request.headers));
    if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterMs, requestId);
  }

  const nonce = createNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    upgradeInsecureRequests: process.env.APP_URL?.startsWith('https://') ?? false,
    // The dashboard uploads straight to object storage (presigned URLs). On every page: the
    // document's policy stays in force across client-side navigations (login → dashboard).
    connectSrc: storageOrigins(),
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
