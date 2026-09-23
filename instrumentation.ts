import * as Sentry from '@sentry/nextjs';
import type { Instrumentation } from 'next';

/** Runs once when a Next.js server instance starts, before it handles requests. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Environment check (exits on failure), console redaction, request IDs + access log.
    const { prepareNodeRuntime } = await import('@/lib/observability/node-runtime');
    prepareNodeRuntime();
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

/** Errors from Server Components, Server Actions, Route Handlers and the proxy. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // Capture first: this marks the error so the logger's Sentry forwarding skips it.
  Sentry.captureRequestError(error, request, context);
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logRequestError } = await import('@/lib/observability/request-errors');
    logRequestError(error, request, context);
  }
};
