/**
 * Preloaded into the production server process: `node --require ./dist/preload.cjs <server>`
 * (bundled by `npm run build:preload`).
 *
 * In production, Next.js runs `instrumentation.ts` lazily, while handling the first request. That is
 * too late to refuse to start with a broken environment, and that first request would get no
 * request ID or access log. This preload does both at process start; `instrumentation.ts` then finds
 * everything already installed (each step is idempotent) and only adds Sentry.
 * Development (`next dev`) runs instrumentation at startup and does not need it.
 */

// Must stay the first import: modules evaluate in import order, and the logger reads its
// settings (LOG_LEVEL, SERVICE_NAME, …) when it is imported.
import './load-env';

import { prepareNodeRuntime } from '@/lib/observability/node-runtime';

prepareNodeRuntime();
