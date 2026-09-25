import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import type { AuditFilters } from '@/lib/admin/filters';
import { type AuditTargetType, isAuditTargetType } from '@/lib/audit/actions';
import { type AuditMetadata, parseAuditMetadata } from '@/lib/validation/audit';
import { getPrisma } from '@/server/db/prisma';

/** Reading the audit log (admin area only; callers have checked the role). */

export const AUDIT_PAGE_SIZE = 30;

/** Event IDs (the column is a UUID: anything else would make Postgres refuse the query). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AuditEntryView {
  id: string;
  createdAt: Date;
  /** One of AUDIT_ACTIONS; shown as it is if a later version added one this code lacks. */
  action: string;
  /** null: the command line (`details.via = "cli"`), or an account deleted since. */
  actor: { id: string; name: string } | null;
  target: {
    type: AuditTargetType;
    id: string | null;
    /** The target's current name, else the one recorded with the entry. */
    name: string | null;
    exists: boolean;
  };
  metadata: AuditMetadata;
}

export interface AuditPage {
  items: AuditEntryView[];
  total: number;
  page: number;
  pages: number;
}

/** Newest first, filtered by action and/or target. */
export async function listAuditEntries(
  filters: AuditFilters,
  pageSize = AUDIT_PAGE_SIZE,
): Promise<AuditPage> {
  const prisma = getPrisma();
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.target ? { targetType: filters.target.type, targetId: filters.target.id } : {}),
  };
  const total = await prisma.auditLog.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, pages);
  const rows = await prisma.auditLog.findMany({
    where,
    // UUIDv7 IDs follow creation order: they break ties within a millisecond.
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      createdAt: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      actor: { select: { id: true, name: true } },
    },
  });

  const idsOf = (type: AuditTargetType) => [
    ...new Set(
      rows.flatMap((row) => (row.targetType === type && row.targetId ? [row.targetId] : [])),
    ),
  ];
  const eventIds = idsOf('event').filter((id) => UUID.test(id));
  const userIds = idsOf('user');
  const [events, users] = await Promise.all([
    eventIds.length > 0
      ? prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, groomName: true, brideName: true },
        })
      : [],
    userIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [],
  ]);
  const names = new Map<string, string>([
    ...events.map(
      (event) => [`event:${event.id}`, `${event.groomName} & ${event.brideName}`] as const,
    ),
    ...users.map((user) => [`user:${user.id}`, user.name] as const),
  ]);

  const items = rows.map((row): AuditEntryView => {
    const metadata = parseAuditMetadata(row.metadata);
    const type: AuditTargetType = isAuditTargetType(row.targetType) ? row.targetType : 'event';
    const current = row.targetId ? names.get(`${type}:${row.targetId}`) : undefined;
    return {
      id: row.id,
      createdAt: row.createdAt,
      action: row.action,
      actor: row.actor,
      target: {
        type,
        id: row.targetId,
        name: current ?? metadata.label ?? null,
        exists: current !== undefined,
      },
      metadata,
    };
  });
  return { items, total, page, pages };
}
