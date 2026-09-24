import 'server-only';

import type { SessionUser } from '@/server/auth/session';
import { getPrisma } from '@/server/db/prisma';

/** The events a user can edit: a couple's own, or every event for an admin. */
export async function listEditableEvents(user: SessionUser) {
  return getPrisma().event.findMany({
    where: user.role === 'admin' ? {} : { ownerId: user.id },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      groomName: true,
      brideName: true,
      startsAt: true,
      phase: true,
      themeId: true,
      isActive: true,
    },
  });
}

export type EditableEventSummary = Awaited<ReturnType<typeof listEditableEvents>>[number];
