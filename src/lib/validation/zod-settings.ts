/**
 * Tells Zod not to use `eval`, without importing Zod (the browser's first-load code must not
 * include it). Under our Content-Security-Policy `eval` is refused, so Zod already runs without
 * it, but first it probes `new Function`, and the browser reports that as a CSP violation on
 * every page with a form. `jitless` skips the probe.
 *
 * Zod keeps its settings on `globalThis.__zod_globalConfig` (what `z.config()` writes, shared by
 * every copy of Zod); zod-settings.test.ts checks that Zod still reads them there.
 */
export function disableZodEval(target: object = globalThis): void {
  const holder = target as { __zod_globalConfig?: Record<string, unknown> };
  holder.__zod_globalConfig ??= {};
  holder.__zod_globalConfig.jitless = true;
}
