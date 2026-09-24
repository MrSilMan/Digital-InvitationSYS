import { errors } from '@/i18n/pt-AO';

/**
 * The 429 page for rate-limited page requests (proxy.ts). A static, script-free HTML page with
 * its own strict CSP, since it bypasses rendering.
 */
export function tooManyRequestsResponse(retryAfterMs: number, requestId: string): Response {
  const { title, description } = errors.tooManyRequests;
  const html = `<!doctype html>
<html lang="pt-AO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#e9f3f6;color:#1d2433;font:18px/1.5 Georgia,'Times New Roman',serif;text-align:center}
h1{margin:0 0 .5rem;font-size:1.8rem;font-weight:500;letter-spacing:.02em}
p{max-width:22rem;margin:0 auto}
</style>
</head>
<body><main><h1>${title}</h1><p>${description}</p></main></body>
</html>`;
  return new Response(html, {
    status: 429,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'Retry-After': String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
      'Cache-Control': 'no-store',
      'x-request-id': requestId,
    },
  });
}
