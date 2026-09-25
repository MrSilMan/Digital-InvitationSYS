import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import type { DashboardAuditAction } from '@/lib/audit/actions';
import { logger } from '@/lib/logger';
import type { AuditMetadata } from '@/lib/validation/audit';
import { getPrisma } from '@/server/db/prisma';

import { type AuditEntry, recordAudit } from './record';

export { type AuditEntry, recordAudit } from './record';

/**
 * The audit log: what admins changed, by whom and when. Entries are append-only (a database
 * trigger refuses UPDATE and DELETE). They hold IDs and facts about events and accounts, never
 * guest data, passwords or tokens.
 */

/** The log line for a committed entry (IDs only). */
export function logAuditEntry(entry: AuditEntry): void {
  logger.info('Admin action', {
    action: entry.action,
    actorId: entry.actorId,
    targetType: entry.target.type,
    targetId: entry.target.id,
  });
}

export type RecordInTransaction = (entry: AuditEntry) => Promise<void>;

/**
 * Runs `work` in a transaction whose changes are recorded with `audit(entry)`: the changes and
 * their entries are committed together. The entries are logged once the commit succeeded.
 * Returning early from `work` still commits: check everything before the first write.
 */
export async function auditedTransaction<R>(
  work: (tx: Prisma.TransactionClient, audit: RecordInTransaction) => Promise<R>,
): Promise<R> {
  const { result, entries } = await getPrisma().$transaction(async (tx) => {
    const recorded: AuditEntry[] = [];
    const value = await work(tx, async (entry) => {
      await recordAudit(tx, entry);
      recorded.push(entry);
    });
    return { result: value, entries: recorded };
  });
  for (const entry of entries) logAuditEntry(entry);
  return result;
}

interface DashboardActor {
  id: string;
  role: 'couple' | 'admin';
}

/**
 * An admin's change to a couple's event through the dashboard (Server Actions and downloads),
 * recorded once the change is done: those services own their transactions. Couples' own changes
 * are not recorded, nor an admin's changes to an event they own. A failure to write the entry is
 * logged (and reaches Sentry) but never undoes or hides the change, which is already saved.
 */
export async function auditDashboardChange(
  user: DashboardActor,
  event: { id: string; slug: string; ownerId: string },
  action: DashboardAuditAction,
  details?: AuditMetadata['details'],
): Promise<void> {
  if (user.role !== 'admin' || event.ownerId === user.id) return;
  const entry: AuditEntry = {
    actorId: user.id,
    action,
    target: { type: 'event', id: event.id },
    metadata: { label: event.slug, ...(details ? { details } : {}) },
  };
  try {
    await recordAudit(getPrisma(), entry);
    logAuditEntry(entry);
  } catch (err) {
    logger.error('Audit entry could not be written', { err, action, eventId: event.id });
  }
}
