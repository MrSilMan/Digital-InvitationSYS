import { createPrismaClient } from '@/server/db/client';

/** Every table the app owns, children first (used to wipe the test database). */
const TABLES = [
  'invitation_view',
  'rsvp',
  'guest',
  'guest_import',
  'media',
  'guest_rule',
  'timeline_item',
  'event_location',
  'event',
  'audit_log',
  'session',
  'account',
  'verification',
  'user',
];

/** Throws unless the URL points at a database whose name ends in `_test`. */
export function assertTestDatabase(url: string | undefined): string {
  if (!url) throw new Error('DATABASE_URL is not set for the integration tests.');
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against "${name}": the name must end in _test.`,
    );
  }
  return url;
}

export function createTestPrisma() {
  return createPrismaClient({
    connectionString: assertTestDatabase(process.env.DATABASE_URL),
    applicationName: 'convites-tests',
    maxConnections: 4,
  });
}

export type TestPrisma = ReturnType<typeof createTestPrisma>;

/** Empties every table of the test database. */
export async function wipeDatabase(prisma: TestPrisma): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} CASCADE`,
  );
}
