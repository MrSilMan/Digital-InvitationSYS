import type { Instrumentation } from 'next';

import { logger } from '@/lib/logger';

type RequestErrorArgs = Parameters<Instrumentation.onRequestError>;

/**
 * Structured log line for errors Next.js reports through `onRequestError` (Server Components,
 * Server Actions, Route Handlers, proxy). Sentry captures the error first, so the logger does not
 * report it a second time.
 */
export function logRequestError(
  error: RequestErrorArgs[0],
  request: RequestErrorArgs[1],
  context: RequestErrorArgs[2],
): void {
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error ? error.digest : undefined;
  logger.error('Unhandled error while handling a request', {
    err: error,
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: 'renderSource' in context ? context.renderSource : undefined,
    digest,
  });
}
