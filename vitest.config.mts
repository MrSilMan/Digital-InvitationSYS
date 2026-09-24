import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/** Integration tests use their own database; the setup refuses any name not ending in `_test`. */
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgresql://convites:convites@localhost:5433/convites_test';
/** …and their own Redis database (never 0, where development data lives). */
const testRedisUrl = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/15';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside React Server environments; tests run server modules directly.
      'server-only': fileURLToPath(new URL('./scripts/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['**/node_modules/**', '.next/**', 'tests/e2e/**', '**/*.int.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.int.test.ts'],
          exclude: ['**/node_modules/**', '.next/**'],
          globalSetup: ['tests/integration/global-setup.ts'],
          // One database: run files one after another.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
          env: {
            DATABASE_URL: testDatabaseUrl,
            REDIS_URL: testRedisUrl,
            APP_ENV: 'test',
            LOG_LEVEL: 'warn',
          },
        },
      },
    ],
  },
});
