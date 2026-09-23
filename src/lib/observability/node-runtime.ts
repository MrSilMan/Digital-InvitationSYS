import { assertServerEnv } from '@/env';
import { installConsoleRedaction } from '@/lib/observability/console-redaction';
import { installHttpRequestHooks } from '@/lib/observability/http-hooks';

/**
 * Startup of the web server's Node.js runtime, called from `instrumentation.ts` before any request.
 * Order matters: configuration errors must stop the process before anything else runs.
 */
export function prepareNodeRuntime(): void {
  assertServerEnv();
  if (process.env.NODE_ENV === 'production') installConsoleRedaction();
  installHttpRequestHooks();
}
