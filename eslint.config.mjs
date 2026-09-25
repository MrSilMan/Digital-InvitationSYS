import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // Server code logs through `@/lib/logger` (structured, redacted); the browser may use console.warn/error.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The browser SDK loads after the page (src/lib/sentry/browser.ts): a static import in browser
    // code would put it back into every page's first-load JavaScript. Server code may import it.
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'instrumentation-client.ts'],
    ignores: ['src/server/**', 'src/lib/sentry/browser-init.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@sentry/nextjs',
              message: 'Use `browserSentry` from @/lib/sentry/browser (server code: src/server).',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    // Command-line scripts talk to the terminal directly.
    files: ['prisma/**/*.ts', 'scripts/**/*.{ts,mjs}'],
    rules: { 'no-console': 'off' },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'src/generated/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
