import type { NodeOptions } from '@sentry/node';

import type { ServerEnv } from '@/env';
import type { ErrorReporter } from '@/lib/error-reporter';
import { getRequestId } from '@/lib/request-context';

import { SENTRY_DATA_COLLECTION, scrubBreadcrumb, scrubEvent, scrubSpan } from './options';

/** Sentry for the Node.js processes (web server and worker): the same privacy settings in both. */
export function serverSentryOptions(env: ServerEnv): NodeOptions {
  return {
    dsn: env.SENTRY_DSN,
    enabled: Boolean(env.SENTRY_DSN),
    environment: env.APP_ENV,
    release: env.APP_RELEASE,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    dataCollection: SENTRY_DATA_COLLECTION,
    initialScope: { tags: { service: env.SERVICE_NAME } },
    beforeSend(event) {
      const requestId = getRequestId();
      if (requestId) event.tags = { request_id: requestId, ...event.tags };
      return scrubEvent(event);
    },
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSendSpan: scrubSpan,
  };
}

type CaptureException = (
  error: unknown,
  hint: { tags?: Record<string, string>; extra?: Record<string, unknown> },
) => unknown;

/** `logger.error(...)` → Sentry (the logger skips errors Sentry already captured). */
export function sentryErrorReporter(captureException: CaptureException): ErrorReporter {
  return (error, context) => {
    const requestId = typeof context.requestId === 'string' ? context.requestId : undefined;
    captureException(error, {
      tags: requestId ? { request_id: requestId } : undefined,
      extra: context,
    });
  };
}
