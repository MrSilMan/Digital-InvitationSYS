import { subscribe } from 'node:diagnostics_channel';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { logger } from '@/lib/logger';
import { enterRequestContext } from '@/lib/request-context';
import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/request-id';

/**
 * Request ID + access log at the Node.js HTTP layer.
 *
 * Why here and not in `proxy.ts`: in Next.js 16 the proxy runs as a separate step before rendering,
 * so an AsyncLocalStorage context opened inside it never reaches Server Components, Server Actions
 * or Route Handlers. Node's built-in `http.server.request.start` diagnostics channel fires
 * synchronously just before the server's request listener, so entering the context there covers the
 * whole request (including the proxy). The same hook knows the final status and duration.
 */

interface HttpServerMessage {
  request: IncomingMessage;
  response: ServerResponse;
}

interface InflightRequest {
  requestId: string;
  startedAt: bigint;
}

/** Logged at `debug` instead of `http`: static assets, framework internals, health probes. */
const QUIET_PATH =
  /^\/(?:_next\/|__nextjs|favicon\.ico$|monitoring|api\/health)|\.(?:js|css|map|png|jpe?g|webp|avif|gif|svg|ico|woff2?|mp3|txt|xml)$/;

const INSTALLED_KEY = Symbol.for('convites.httpHooks');
const inflight = new WeakMap<IncomingMessage, InflightRequest>();

function onRequestStart(message: unknown): void {
  const { request, response } = message as HttpServerMessage;
  const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);
  // Next.js (proxy, `headers()`) reads the same header, so everything agrees on one ID.
  request.headers[REQUEST_ID_HEADER] = requestId;
  if (!response.headersSent) response.setHeader(REQUEST_ID_HEADER, requestId);
  inflight.set(request, { requestId, startedAt: process.hrtime.bigint() });
  enterRequestContext({ requestId });
}

function onResponseFinish(message: unknown): void {
  const { request, response } = message as HttpServerMessage;
  const entry = inflight.get(request);
  if (!entry) return;
  inflight.delete(request);

  const path = request.url ?? '/';
  const pathname = path.split('?', 1)[0] ?? path;
  const durationMs = Math.round(Number(process.hrtime.bigint() - entry.startedAt) / 10_000) / 100;
  const method = request.method ?? 'GET';
  const status = response.statusCode;

  // The path is redacted by the logger (guest tokens, sensitive query parameters).
  logger.log(
    QUIET_PATH.test(pathname) ? 'debug' : 'http',
    `${method} ${path} ${status} ${durationMs}ms`,
    {
      requestId: entry.requestId,
      method,
      path,
      status,
      durationMs,
    },
  );
}

/** Idempotent: installs the hooks once per process. */
export function installHttpRequestHooks(): void {
  const g = globalThis as typeof globalThis & { [INSTALLED_KEY]?: boolean };
  if (g[INSTALLED_KEY]) return;
  g[INSTALLED_KEY] = true;
  subscribe('http.server.request.start', onRequestStart);
  subscribe('http.server.response.finish', onResponseFinish);
}
