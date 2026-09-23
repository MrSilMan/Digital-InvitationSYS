/**
 * Browser-safe public configuration (NEXT_PUBLIC_*), inlined into the client bundle at build time.
 *
 * Deliberately Zod-free to keep guest pages light: `src/env.ts` validates these same variables on
 * the server at startup; here we only apply safe fallbacks.
 */

export function parseSampleRate(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : fallback;
}

export const publicEnv = {
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  sentryTracesSampleRate: parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 0.1),
} as const;
