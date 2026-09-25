import type { Prisma } from '@/generated/prisma/client';
import type { AuditAction, AuditTargetType } from '@/lib/audit/actions';
import { type AuditMetadata, auditMetadataSchema } from '@/lib/validation/audit';

/**
 * Writing one audit entry. Shared by the web app (src/server/audit/audit-log.ts) and
 * `npm run admin:create`, so no 'server-only' marker or logger here.
 */

/** A transaction, or the client itself for a single write. */
type Db = Pick<Prisma.TransactionClient, 'auditLog'>;

export interface AuditEntry {
  /** The signed-in admin; null for the command line (with `details.via = "cli"`). */
  actorId: string | null;
  action: AuditAction;
  target: { type: AuditTargetType; id: string };
  metadata?: AuditMetadata;
}

/**
 * Writes an entry. Call it inside the transaction that makes the change, so the change and its
 * entry are committed together, or neither is.
 */
export async function recordAudit(db: Db, entry: AuditEntry): Promise<void> {
  const metadata = entry.metadata ? auditMetadataSchema.parse(entry.metadata) : undefined;
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.target.type,
      targetId: entry.target.id,
      ...(metadata ? { metadata } : {}),
    },
    select: { id: true },
  });
}
