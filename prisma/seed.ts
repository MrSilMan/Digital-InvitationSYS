/**
 * Demo data for local development: `npm run db:seed` (or `npm run db:reset` to start over).
 * Never runs in production. Passwords come from SEED_COUPLE_PASSWORD / SEED_ADMIN_PASSWORD
 * (defaults in prisma/seed/demo-data.ts).
 */
import { loadEnvConfig } from '@next/env';

import { createPrismaClient } from '@/server/db/client';

import { seedDemo } from './seed/demo';
import { DEMO_PASSWORDS } from './seed/demo-data';

async function main(): Promise<void> {
  // Already loaded when started by `prisma db seed`; needed when run directly with tsx.
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

  if (process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed demo data in production.');
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set (see .env.example).');
    process.exit(1);
  }

  const prisma = createPrismaClient({
    connectionString: databaseUrl,
    applicationName: 'convites-seed',
    maxConnections: 2,
  });
  try {
    const result = await seedDemo(prisma, {
      couplePassword: process.env.SEED_COUPLE_PASSWORD || DEMO_PASSWORDS.couple,
      adminPassword: process.env.SEED_ADMIN_PASSWORD || DEMO_PASSWORDS.admin,
    });

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const width = Math.max(...result.guests.map((guest) => guest.displayName.length));
    console.log(`\nDemo data ready: event "${result.slug}" (${result.eventId})`);
    for (const user of result.users) console.log(`  Login (${user.role}): ${user.email}`);
    console.log(
      '  Passwords: SEED_COUPLE_PASSWORD / SEED_ADMIN_PASSWORD or the defaults in README',
    );
    console.log('  Invitation links:');
    for (const guest of result.guests) {
      console.log(
        `    ${guest.displayName.padEnd(width)}  ${appUrl}/c/${result.slug}/${guest.token}`,
      );
    }
    for (const [title, links] of [
      ['Save the Date links (same wedding, earlier phase)', result.saveTheDate],
      ['"Champanhe" theme links (same wedding, other theme)', result.champanhe],
    ] as const) {
      console.log(`  ${title}:`);
      for (const guest of links.guests) {
        console.log(
          `    ${guest.displayName.padEnd(width)}  ${appUrl}/c/${links.slug}/${guest.token}`,
        );
      }
    }
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
