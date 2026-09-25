import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests (tests/e2e) in a phone-sized Chromium, against the demo data:
 * `docker compose up -d`, then `npm run test:e2e` (the global setup re-seeds the demo data and
 * clears rate-limit counters; E2E_SKIP_RESET=1 skips that for a remote server).
 * Starts `next dev` on port 3100 and a worker (uploads) unless E2E_BASE_URL points at a running
 * app (e.g. the production build in CI, Phase 10).
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    locale: 'pt-AO',
    timezoneId: 'Africa/Luanda',
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'npm run dev -- --port 3100',
          url: `${baseURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          // A second worker next to one already running is fine: they share the queue.
          name: 'Worker',
          command: 'npm run worker',
          wait: { stdout: /Worker started/ },
          gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
          timeout: 60_000,
        },
      ],
});
