/**
 * Pluggable error reporter used by the logger: every `error`-level log is forwarded to it.
 *
 * The web app registers Sentry in `sentry.server.config.ts`; the worker registers its own SDK.
 * Stored on `globalThis` so every server bundle (instrumentation, routes, actions) shares it.
 */
export type ErrorReporter = (error: Error, context: Record<string, unknown>) => void;

const REPORTER_KEY = Symbol.for('convites.errorReporter');

type GlobalWithReporter = typeof globalThis & { [REPORTER_KEY]?: ErrorReporter };

export function setErrorReporter(reporter: ErrorReporter | undefined): void {
  (globalThis as GlobalWithReporter)[REPORTER_KEY] = reporter;
}

export function getErrorReporter(): ErrorReporter | undefined {
  return (globalThis as GlobalWithReporter)[REPORTER_KEY];
}

/**
 * True when Sentry already captured this exact error object (it marks captured errors with
 * `__sentry_captured__`), e.g. through `onRequestError`. Prevents double reports.
 */
export function isErrorAlreadyReported(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { __sentry_captured__?: unknown }).__sentry_captured__ === true
  );
}
