import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside React Server environments; tests run server modules directly.
      'server-only': fileURLToPath(new URL('./scripts/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.next/**', 'tests/e2e/**'],
    restoreMocks: true,
    unstubEnvs: true,
  },
});
