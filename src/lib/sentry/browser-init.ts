// Only what is used, by name: the bundler then leaves out the rest of the SDK (Session Replay,
// the feedback widget…), which `import * as Sentry` returned as a whole would keep.
import { captureException, captureRouterTransitionStart, init, setUser } from '@sentry/nextjs';

import { publicEnv } from '@/env.public';

import type { BrowserSdk } from './browser';
import { SENTRY_DATA_COLLECTION, scrubBreadcrumb, scrubEvent, scrubSpan } from './options';

/**
 * Starts the browser SDK. Only reached through the dynamic import in `./browser.ts`, so the SDK
 * (most of a guest page's JavaScript otherwise) loads after the page. Deliberately lean for
 * low-end phones: no Session Replay, no feedback widget.
 */
export function initBrowserSentry(): BrowserSdk {
  // ID of the request that served this page (rendered by the root layout), to correlate with logs.
  const requestId = document.documentElement.dataset.requestId;
  init({
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
  return { captureException, setUser, captureRouterTransitionStart };
}
