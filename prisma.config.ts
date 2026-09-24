import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer reads .env files. Load them exactly like Next.js does (.env.local,
// .env.development, .env, …) so the CLI and the app see the same DATABASE_URL.
// Variables already set in the environment (Docker, CI) always win.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` runs without a database (e.g. on `npm install` in CI or Docker);
    // commands that connect fail with a clear error when DATABASE_URL is missing.
    url: process.env.DATABASE_URL ?? '',
  },
});
