import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

/**
 * Static security headers for every response.
 * The Content-Security-Policy is NOT here: it needs a per-request nonce, so `proxy.ts` sets it.
 */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  // SAMEORIGIN (not DENY): the dashboard previews invitations in a same-origin iframe.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** Guest invitation links carry a secret token in the path: never leak it and never index it. */
const invitationHeaders = [
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // AVIF where the browser takes it (theme artwork is a third smaller), WebP otherwise. Uploads
    // do not go through the optimizer: the worker makes their WebP sizes.
    formats: ['image/avif', 'image/webp'],
    // Phone-first widths (the defaults start at 640): a 360 px phone at 1.5x needs 540 px, and
    // uploads are picked from their own ladders (src/lib/media/ladder.ts) by the nearest width.
    deviceSizes: [360, 540, 720, 828, 1080, 1440, 1920],
    // Only our own asset folders can go through the image optimizer, without query strings.
    localPatterns: [
      { pathname: '/themes/**', search: '' },
      { pathname: '/demo/**', search: '' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/c/:path*', headers: invitationHeaders },
    ];
  },
};

// Source maps are only generated (hidden), uploaded and then deleted when SENTRY_AUTH_TOKEN is set (CI).
// Without a token nothing is generated, so no source map is ever served publicly.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  // Browser events go through our own origin: survives ad blockers and keeps CSP `connect-src 'self'`.
  // `proxy.ts` excludes this path from its matcher.
  tunnelRoute: '/monitoring',
  release: {
    name: process.env.SENTRY_RELEASE ?? process.env.APP_RELEASE,
  },
  sourcemaps: {
    disable: !uploadSourceMaps,
    deleteSourcemapsAfterUpload: true,
  },
});
