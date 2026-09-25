import type * as SentrySdk from '@sentry/nextjs';

import { publicEnv } from '@/env.public';

/**
 * Sentry in the browser, loaded after the page.
 *
 * The browser SDK is most of a guest page's JavaScript, and guests open invitations on low-end
 * phones over mobile data. So the SDK is only downloaded a few seconds after the page has loaded,
 * when the browser is idle (or at the first error), and only when a DSN is configured. Until then,
 * errors wait in a short queue and a small listener catches uncaught errors; the SDK's own
 * handlers take over once it runs.
 *
 * Browser code reports through `browserSentry` from here, never by importing `@sentry/nextjs`,
 * which would pull the SDK back into the first-load bundle.
 */

/** The part of the SDK the app uses. */
export type BrowserSdk = Pick<
  typeof SentrySdk,
  'captureException' | 'setUser' | 'captureRouterTransitionStart'
>;

// A type alias (not an interface), so it fits the SDK's indexable `User`.
export type SentryUser = { id: string; role: string };

/** The window, as far as this module needs it (tests pass a fake). */
export interface BrowserWindow {
  addEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: { once?: boolean },
  ): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  setTimeout: (callback: () => void, ms: number) => unknown;
  document: { readyState: DocumentReadyState };
}

export interface LazySentry {
  /** Downloads and starts the SDK, once. Resolves when it is ready (or could not be loaded). */
  load(): Promise<void>;
  /** Reports an error. Before the SDK is ready, it waits in the queue and the SDK loads now. */
  captureException(error: unknown, mechanism?: string): void;
  /** Tags later events with the signed-in user (ID and role only); null clears it. */
  setUser(user: SentryUser | null): void;
  /** Next.js navigation spans (`onRouterTransitionStart`); ignored until the SDK is ready. */
  captureRouterTransitionStart(href: string, navigationType: string): void;
  /** Reports uncaught errors and rejections until the SDK's own handlers take over. */
  watchEarlyErrors(target: BrowserWindow): void;
}

/** Calls that wait for the SDK at most; errors beyond that are dropped (a loop, most likely). */
export const QUEUE_LIMIT = 20;

export function createLazySentry(options: {
  enabled: boolean;
  importSdk: () => Promise<BrowserSdk>;
}): LazySentry {
  let sdk: BrowserSdk | null = null;
  let loading: Promise<void> | null = null;
  let failed = false;
  // undefined: never set before the SDK was ready.
  let pendingUser: SentryUser | null | undefined;
  const queue: Array<(ready: BrowserSdk) => void> = [];
  const stopWatching: Array<() => void> = [];

  function load(): Promise<void> {
    if (!options.enabled) return Promise.resolve();
    loading ??= options
      .importSdk()
      .then((ready) => {
        sdk = ready;
        for (const stop of stopWatching.splice(0)) stop();
        if (pendingUser !== undefined) ready.setUser(pendingUser);
        for (const call of queue.splice(0)) call(ready);
      })
      .catch(() => {
        // Blocked (content blocker, offline): errors are simply not reported from this page.
        failed = true;
        queue.length = 0;
        for (const stop of stopWatching.splice(0)) stop();
      });
    return loading;
  }

  function whenReady(call: (ready: BrowserSdk) => void): boolean {
    if (!options.enabled || failed) return false;
    if (sdk) {
      call(sdk);
      return false;
    }
    if (queue.length < QUEUE_LIMIT) queue.push(call);
    return true;
  }

  function captureException(error: unknown, mechanism?: string): void {
    const hint = mechanism ? { mechanism: { type: mechanism, handled: false } } : undefined;
    if (whenReady((ready) => ready.captureException(error, hint))) void load();
  }

  return {
    load,
    captureException,
    setUser(user) {
      if (sdk) sdk.setUser(user);
      else pendingUser = user;
    },
    captureRouterTransitionStart(href, navigationType) {
      sdk?.captureRouterTransitionStart(href, navigationType);
    },
    watchEarlyErrors(target) {
      if (!options.enabled || sdk || failed) return;
      const onError = (event: Event) => {
        // Only real errors: "Script error." events from other origins carry nothing useful.
        const { error } = event as ErrorEvent;
        if (error) captureException(error, 'auto.browser.early.onerror');
      };
      const onRejection = (event: Event) => {
        captureException(
          (event as PromiseRejectionEvent).reason,
          'auto.browser.early.onunhandledrejection',
        );
      };
      target.addEventListener('error', onError);
      target.addEventListener('unhandledrejection', onRejection);
      stopWatching.push(() => {
        target.removeEventListener('error', onError);
        target.removeEventListener('unhandledrejection', onRejection);
      });
    },
  };
}

/**
 * How long the SDK waits after the load event (then for an idle moment). Starting it costs a slow
 * phone a few hundred milliseconds of work; the first seconds belong to the guest (the envelope
 * tap). Errors meanwhile are not lost: they load the SDK at once.
 */
export const LOAD_DELAY_MS = 3_000;

/** Loads the SDK a little after the page has loaded, when the browser is idle (at the latest after 15 s). */
export function loadAfterPage(sentry: LazySentry, target: BrowserWindow): void {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    const run = () => void sentry.load();
    if (target.requestIdleCallback) target.requestIdleCallback(run, { timeout: 5_000 });
    else target.setTimeout(run, 0);
  };
  const afterLoad = () => void target.setTimeout(start, LOAD_DELAY_MS);
  if (target.document.readyState === 'complete') afterLoad();
  else target.addEventListener('load', afterLoad, { once: true });
  // A request that never finishes would otherwise hold back the load event forever.
  target.setTimeout(start, 15_000);
}

const GLOBAL_KEY = Symbol.for('convites.sentry.browser');

/** One instance per page, even if bundling duplicates this module. */
export const browserSentry: LazySentry = ((globalThis as Record<symbol, LazySentry | undefined>)[
  GLOBAL_KEY
] ??= createLazySentry({
  enabled: Boolean(publicEnv.sentryDsn),
  importSdk: () => import('./browser-init').then((module) => module.initBrowserSentry()),
}));
