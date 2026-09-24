import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

import type { TestProject } from 'vitest/node';

import { assertTestDatabase, createTestPrisma, wipeDatabase } from './db';

/**
 * Brings the test database up to date with `prisma migrate deploy` (creates it if needed,
 * never resets it), then empties it so every run starts clean.
 *
 * If a migration was edited after it was applied here, drop the test database and re-run:
 *   docker compose exec postgres dropdb -U convites convites_test
 */
export default async function setup(project: TestProject): Promise<void> {
  const url = assertTestDatabase(project.config.env.DATABASE_URL);
  process.env.DATABASE_URL = url;

  const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });

  const prisma = createTestPrisma();
  try {
    await wipeDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
