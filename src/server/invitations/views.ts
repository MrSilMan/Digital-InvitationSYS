import 'server-only';

import type { Redis } from 'ioredis';

import { logger } from '@/lib/logger';
import { KEY_PREFIX } from '@/server/cache/json-cache';
import { getPrisma } from '@/server/db/prisma';
import { getReadyRedis, withRedis } from '@/server/redis';

/**
 * "Opened" tracking: at most one InvitationView per guest per hour. A Redis key (SET NX, one hour)
 * de-duplicates; without Redis, Postgres is asked for a view in the last hour instead.
 */

const WINDOW_SECONDS = 60 * 60;

/** Records a view unless one was recorded in the last hour; true when a row was written. */
export async function recordInvitationView(
  guestId: string,
  options: { redis?: Redis | null; now?: Date } = {},
): Promise<boolean> {
  const now = options.now ?? new Date();
  const redis = options.redis === undefined ? getReadyRedis() : options.redis;
  // 'OK' = first view this hour, null = already counted, undefined = Redis unavailable.
  const claim = await withRedis<'OK' | null | undefined>(
    'view dedupe',
    (client) => client.set(`${KEY_PREFIX}view:${guestId}`, '1', 'EX', WINDOW_SECONDS, 'NX'),
    undefined,
    redis,
  );
  if (claim === null) return false;
  if (claim === undefined) {
    const recent = await getPrisma().invitationView.findFirst({
      where: { guestId, openedAt: { gte: new Date(now.getTime() - WINDOW_SECONDS * 1000) } },
      select: { id: true },
    });
    if (recent) return false;
  }
  await getPrisma().invitationView.create({ data: { guestId, openedAt: now } });
  logger.debug('Invitation view recorded', { guestId });
  return true;
}
