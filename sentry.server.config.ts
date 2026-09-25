import * as Sentry from '@sentry/nextjs';

import { getServerEnv } from '@/env';
import { setErrorReporter } from '@/lib/error-reporter';
import { sentryErrorReporter, serverSentryOptions } from '@/lib/sentry/server-options';

// Loaded from instrumentation.ts (Node.js runtime) after the environment has been validated.
Sentry.init(serverSentryOptions(getServerEnv()));

// `logger.error(...)` → Sentry (the logger skips errors Sentry already captured).
setErrorReporter(sentryErrorReporter(Sentry.captureException));
