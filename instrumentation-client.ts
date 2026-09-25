import { browserSentry, loadAfterPage } from '@/lib/sentry/browser';
import { disableZodEval } from '@/lib/validation/zod-settings';

// Before any form code runs: Zod without its `eval` probe, which our CSP reports as a violation.
disableZodEval();

// The browser SDK loads after the page (see src/lib/sentry/browser.ts); nothing at all without a
// DSN. Uncaught errors from before then are still reported.
browserSentry.watchEarlyErrors(window);
loadAfterPage(browserSentry, window);

export function onRouterTransitionStart(href: string, navigationType: string): void {
  browserSentry.captureRouterTransitionStart(href, navigationType);
}
