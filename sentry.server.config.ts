import * as Sentry from '@sentry/nextjs';

import { getServerEnv } from '@/env';
import { setErrorReporter } from '@/lib/error-reporter';
import { getRequestId } from '@/lib/request-context';
import {
  SENTRY_DATA_COLLECTION,
  scrubBreadcrumb,
  scrubEvent,
  scrubSpan,
} from '@/lib/sentry/options';

// Loaded from instrumentation.ts (Node.js runtime) after the environment has been validated.
const env = getServerEnv();

Sentry.init({
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
});

// `logger.error(...)` → Sentry (the logger skips errors Sentry already captured).
setErrorReporter((error, context) => {
  const requestId = typeof context.requestId === 'string' ? context.requestId : undefined;
  Sentry.captureException(error, {
    tags: requestId ? { request_id: requestId } : undefined,
    extra: context,
  });
});
