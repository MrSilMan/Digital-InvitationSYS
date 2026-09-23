import * as Sentry from '@sentry/nextjs';

import { parseSampleRate } from '@/env.public';
import {
  SENTRY_DATA_COLLECTION,
  scrubBreadcrumb,
  scrubEvent,
  scrubSpan,
} from '@/lib/sentry/options';

// Edge runtime (no route uses it today; kept so future edge code is monitored). Kept light: no Zod.
Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.APP_ENV ?? 'development',
  release: process.env.APP_RELEASE,
  tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  dataCollection: SENTRY_DATA_COLLECTION,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
  beforeSendSpan: scrubSpan,
});
