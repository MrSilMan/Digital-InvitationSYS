import { describe, expect, it, vi } from 'vitest';

import {
  type BrowserSdk,
  type BrowserWindow,
  createLazySentry,
  LOAD_DELAY_MS,
  loadAfterPage,
  QUEUE_LIMIT,
} from './browser';

function fakeSdk() {
  return {
    captureException: vi.fn((_error: unknown, _hint?: unknown) => 'event-id'),
    setUser: vi.fn(),
    captureRouterTransitionStart: vi.fn(),
  };
}

function lazySentry(options: { enabled?: boolean; fails?: boolean } = {}) {
  const sdk = fakeSdk();
  const importSdk = vi.fn(() =>
    options.fails
      ? Promise.reject(new Error('blocked'))
      : Promise.resolve(sdk as unknown as BrowserSdk),
  );
  const sentry = createLazySentry({ enabled: options.enabled ?? true, importSdk });
  return { sentry, sdk, importSdk };
}

function fakeWindow(readyState: DocumentReadyState = 'loading') {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  const idle: Array<() => void> = [];
  const timers: Array<{ callback: () => void; ms: number }> = [];
  const win = {
    document: { readyState },
    addEventListener(type: string, listener: (event: Event) => void, opts?: { once?: boolean }) {
      const wrapped = opts?.once
        ? (event: Event) => {
            listeners.get(type)?.delete(wrapped);
            listener(event);
          }
        : listener;
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(wrapped);
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      listeners.get(type)?.delete(listener);
    },
    requestIdleCallback(callback: () => void) {
      idle.push(callback);
      return idle.length;
    },
    setTimeout(callback: () => void, ms: number) {
      timers.push({ callback, ms });
      return timers.length;
    },
  } satisfies BrowserWindow;
  return {
    win,
    dispatch: (type: string, event: object) => {
      for (const listener of [...(listeners.get(type) ?? [])]) listener(event as Event);
    },
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    runIdle: () => {
      for (const callback of idle.splice(0)) callback();
    },
    idleCount: () => idle.length,
    timers,
  };
}

describe('browser Sentry, loaded after the page', () => {
  it('downloads nothing and listens to nothing without a DSN', async () => {
    const { sentry, importSdk } = lazySentry({ enabled: false });
    const { win, listenerCount } = fakeWindow();
    sentry.watchEarlyErrors(win);
    sentry.captureException(new Error('boom'));
    await sentry.load();
    expect(importSdk).not.toHaveBeenCalled();
    expect(listenerCount('error')).toBe(0);
  });

  it('keeps errors until the SDK is ready, loads it at the first one, and sends the user first', async () => {
    const { sentry, sdk, importSdk } = lazySentry();
    sentry.setUser({ id: 'u1', role: 'couple' });
    const first = new Error('first');
    const second = new Error('second');
    sentry.captureException(first);
    sentry.captureException(second);
    expect(importSdk).toHaveBeenCalledTimes(1);

    await sentry.load();
    expect(sdk.setUser).toHaveBeenCalledWith({ id: 'u1', role: 'couple' });
    expect(sdk.captureException.mock.calls.map(([error]) => error)).toEqual([first, second]);
    expect(sdk.setUser.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.captureException.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('passes calls straight to the SDK once it is ready; navigations only from then on', async () => {
    const { sentry, sdk, importSdk } = lazySentry();
    sentry.captureRouterTransitionStart('/painel', 'push');
    await sentry.load();
    expect(sdk.captureRouterTransitionStart).not.toHaveBeenCalled();

    sentry.captureRouterTransitionStart('/painel/conta', 'push');
    sentry.setUser(null);
    sentry.captureException(new Error('later'));
    expect(sdk.captureRouterTransitionStart).toHaveBeenCalledWith('/painel/conta', 'push');
    expect(sdk.setUser).toHaveBeenCalledWith(null);
    expect(sdk.captureException).toHaveBeenCalledTimes(1);
    expect(importSdk).toHaveBeenCalledTimes(1);
  });

  it(`keeps at most ${QUEUE_LIMIT} errors while the SDK loads`, async () => {
    const { sentry, sdk } = lazySentry();
    for (let index = 0; index < QUEUE_LIMIT + 5; index += 1) {
      sentry.captureException(new Error(`error ${index}`));
    }
    await sentry.load();
    expect(sdk.captureException).toHaveBeenCalledTimes(QUEUE_LIMIT);
  });

  it("reports uncaught errors and rejections until the SDK's own handlers take over", async () => {
    const { sentry, sdk, importSdk } = lazySentry();
    const { win, dispatch, listenerCount } = fakeWindow();
    sentry.watchEarlyErrors(win);

    const error = new Error('uncaught');
    dispatch('error', { error });
    // "Script error." from another origin: nothing to report.
    dispatch('error', { error: null, message: 'Script error.' });
    dispatch('unhandledrejection', { reason: 'rejected' });
    expect(importSdk).toHaveBeenCalledTimes(1);

    await sentry.load();
    expect(sdk.captureException.mock.calls).toEqual([
      [error, { mechanism: { type: 'auto.browser.early.onerror', handled: false } }],
      [
        'rejected',
        { mechanism: { type: 'auto.browser.early.onunhandledrejection', handled: false } },
      ],
    ]);
    expect(listenerCount('error')).toBe(0);
    expect(listenerCount('unhandledrejection')).toBe(0);
  });

  it('drops errors quietly when the SDK cannot be downloaded (content blocker, offline)', async () => {
    const { sentry, importSdk } = lazySentry({ fails: true });
    const { win, listenerCount } = fakeWindow();
    sentry.watchEarlyErrors(win);
    sentry.captureException(new Error('first'));
    await expect(sentry.load()).resolves.toBeUndefined();

    sentry.captureException(new Error('second'));
    expect(importSdk).toHaveBeenCalledTimes(1);
    expect(listenerCount('error')).toBe(0);
  });
});

describe('loadAfterPage', () => {
  it('waits for the load event, a few seconds more, then for an idle moment', () => {
    const { sentry, importSdk } = lazySentry();
    const { win, dispatch, runIdle, idleCount, timers } = fakeWindow('interactive');
    loadAfterPage(sentry, win);
    expect(timers.some((timer) => timer.ms === LOAD_DELAY_MS)).toBe(false);

    dispatch('load', {});
    const delay = timers.find((timer) => timer.ms === LOAD_DELAY_MS);
    expect(delay).toBeDefined();
    expect(idleCount()).toBe(0);

    delay?.callback();
    expect(importSdk).not.toHaveBeenCalled();
    runIdle();
    expect(importSdk).toHaveBeenCalledTimes(1);
  });

  it('counts the delay from now on a page that has already loaded', () => {
    const { sentry, importSdk } = lazySentry();
    const { win, runIdle, timers } = fakeWindow('complete');
    loadAfterPage(sentry, win);
    timers.find((timer) => timer.ms === LOAD_DELAY_MS)?.callback();
    runIdle();
    expect(importSdk).toHaveBeenCalledTimes(1);
  });

  it('gives up waiting for the load event after 15 seconds, and starts only once', () => {
    const { sentry, importSdk } = lazySentry();
    const { win, dispatch, runIdle, timers } = fakeWindow('loading');
    loadAfterPage(sentry, win);
    const fallback = timers.find((timer) => timer.ms === 15_000);
    expect(fallback).toBeDefined();

    fallback?.callback();
    dispatch('load', {});
    runIdle();
    expect(importSdk).toHaveBeenCalledTimes(1);
  });
});
