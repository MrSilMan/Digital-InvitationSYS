import 'server-only';

import { notFound } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import {
  canAccessEvent,
  getSessionUser,
  requireUser,
  type SessionUser,
} from '@/server/auth/session';
import { getPrisma } from '@/server/db/prisma';

/**
 * Who may edit an event: its couple and the admins. Someone else's event and a missing one get the
 * same answer, so event IDs cannot be probed.
 */

const eventIdSchema = z.uuid();

export interface EditableEvent {
  id: string;
  slug: string;
  ownerId: string;
}

/** Read once per request (React `cache`): an event's layout and page both check it. */
export const findEditableEvent = cache(
  async (user: SessionUser, eventId: unknown): Promise<EditableEvent | null> => {
    const id = eventIdSchema.safeParse(eventId);
    if (!id.success) return null;
    const event = await getPrisma().event.findUnique({
      where: { id: id.data },
      select: { id: true, slug: true, ownerId: true },
    });
    return event && canAccessEvent(user, event.ownerId) ? event : null;
  },
);

/** Pages: the signed-in user and the event, or the login page / "not found". */
export async function requireEditableEvent(
  eventId: string,
): Promise<{ user: SessionUser; event: EditableEvent }> {
  const user = await requireUser();
  const event = await findEditableEvent(user, eventId);
  if (!event) notFound();
  return { user, event };
}

export type EventActionAuth =
  | { ok: true; user: SessionUser; event: EditableEvent }
  | { ok: false; error: 'unauthenticated' | 'not-found' };

/** Server Actions: never trust the event ID sent by the browser. */
export async function authorizeEventAction(eventId: unknown): Promise<EventActionAuth> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'unauthenticated' };
  const event = await findEditableEvent(user, eventId);
  if (!event) {
    logger.warn('Event access refused', {
      eventId: typeof eventId === 'string' ? eventId.slice(0, 64) : typeof eventId,
    });
    return { ok: false, error: 'not-found' };
  }
  return { ok: true, user, event };
}
