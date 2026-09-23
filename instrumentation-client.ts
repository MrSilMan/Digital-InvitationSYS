import * as Sentry from '@sentry/nextjs';

import { publicEnv } from '@/env.public';
import {
  SENTRY_DATA_COLLECTION,
  scrubBreadcrumb,
  scrubEvent,
  scrubSpan,
} from '@/lib/sentry/options';

// ID of the request that served this page (rendered by the root layout), to correlate with server logs.
const requestId = document.documentElement.dataset.requestId;

// Deliberately lean for low-end phones: no Session Replay, no feedback widget.
Sentry.init({
  dsn: publicEnv.sentryDsn,
  enabled: Boolean(publicEnv.sentryDsn),
  environment: publicEnv.appEnv,
  tracesSampleRate: publicEnv.sentryTracesSampleRate,
  dataCollection: SENTRY_DATA_COLLECTION,
  initialScope: requestId ? { tags: { request_id: requestId } } : undefined,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
  beforeSendSpan: scrubSpan,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
