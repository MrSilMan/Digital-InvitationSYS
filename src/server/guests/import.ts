import 'server-only';

import type { GuestImportView } from '@/features/dashboard/guests/types';
import { createGuestToken } from '@/lib/guest-token';
import {
  IMPORT_LIMITS,
  type ImportFailure,
  type ImportProblem,
  type ImportReport,
  parseImportReport,
  toImportFailure,
} from '@/lib/guests/import';
import { logger } from '@/lib/logger';
import type { GuestData } from '@/lib/validation/guest';
import { getPrisma } from '@/server/db/prisma';
import { requeueGuestImport } from '@/server/queues/guest-queue';

import { guestIdentity, parseGuestCsv, validateGuestRows } from './csv';
import { lockEvent } from './service';

/**
 * CSV imports of guests. The Server Action stores the file (as text) in a PENDING GuestImport and
 * queues it; the worker runs `runGuestImport`, or the action does when Redis is down.
 *
 * `runGuestImport` is idempotent: only a PENDING import is processed, and it is claimed (set DONE)
 * inside the transaction that adds its guests, so a retried or duplicated job adds nothing twice.
 * Valid rows are imported, invalid ones reported; rows already on the list (same name and phone)
 * are skipped. If the new guests do not fit in the guest limit, nothing is imported.
 */

interface EventRef {
  id: string;
  slug: string;
}

/** Imports shown in the dialog list only the first rows not imported. */
const SHOWN_PROBLEMS = 100;
/** A waiting import this old has lost its job: the sweep queues it again. */
const STALE_PENDING_MS = 2 * 60_000;
/** …and after a day, it is given up. */
const ABANDONED_PENDING_MS = 24 * 60 * 60_000;

/** Creates a waiting import and drops the event's oldest finished ones (they hold guest data). */
export async function createGuestImport(
  event: EventRef,
  input: { userId: string; fileName: string; content: string },
): Promise<string> {
  const prisma = getPrisma();
  const { id } = await prisma.guestImport.create({
    data: {
      eventId: event.id,
      createdById: input.userId,
      fileName: input.fileName,
      content: input.content,
    },
    select: { id: true },
  });
  const kept = await prisma.guestImport.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: 'desc' },
    take: IMPORT_LIMITS.kept,
    select: { id: true },
  });
  await prisma.guestImport.deleteMany({
    where: {
      eventId: event.id,
      status: { not: 'PENDING' },
      id: { notIn: kept.map((row) => row.id) },
    },
  });
  return id;
}

async function failImport(
  importId: string,
  failure: ImportFailure,
  totalRows?: number,
): Promise<boolean> {
  const { count } = await getPrisma().guestImport.updateMany({
    where: { id: importId, status: 'PENDING' },
    data: { status: 'FAILED', failure, content: null, totalRows, finishedAt: new Date() },
  });
  return count > 0;
}

/** After the worker's last attempt failed (or an abandoned import): the file is given up. */
export async function markImportFailed(importId: string): Promise<void> {
  await failImport(importId, 'error');
}

export type ImportOutcome =
  | { status: 'DONE'; imported: number; duplicates: number; invalid: number }
  | { status: 'FAILED'; failure: ImportFailure }
  /** Not PENDING any more (already processed), or its event is gone. */
  | { status: 'skipped' };

export async function runGuestImport(importId: string): Promise<ImportOutcome> {
  const prisma = getPrisma();
  const job = await prisma.guestImport.findUnique({
    where: { id: importId },
    select: { eventId: true, status: true, content: true },
  });
  if (!job || job.status !== 'PENDING' || job.content === null) return { status: 'skipped' };

  const parsed = parseGuestCsv(job.content);
  if (!parsed.ok) {
    await failImport(importId, parsed.failure);
    logger.info('Guest import refused', {
      importId,
      eventId: job.eventId,
      failure: parsed.failure,
    });
    return { status: 'FAILED', failure: parsed.failure };
  }
  const { valid, invalid } = validateGuestRows(parsed.rows);
  const totalRows = parsed.rows.length;

  const outcome = await prisma.$transaction(
    async (tx): Promise<ImportOutcome> => {
      const event = await lockEvent(tx, job.eventId);
      if (!event) return { status: 'skipped' };
      const claimed = await tx.guestImport.updateMany({
        where: { id: importId, status: 'PENDING' },
        data: { status: 'DONE', content: null, finishedAt: new Date(), totalRows },
      });
      if (claimed.count === 0) return { status: 'skipped' };

      const existing = await tx.guest.findMany({
        where: { eventId: job.eventId },
        select: { displayName: true, phone: true, groupTag: true },
      });
      const seen = new Set(existing.map(guestIdentity));
      // A group written differently ("amigos", "Amigos") takes the spelling already in use.
      const groups = new Map<string, string>();
      for (const guest of existing) {
        const key = guest.groupTag?.toLocaleLowerCase('pt');
        if (key && guest.groupTag && !groups.has(key)) groups.set(key, guest.groupTag);
      }

      const fresh: GuestData[] = [];
      const duplicates: ImportProblem[] = [];
      for (const item of valid) {
        const identity = guestIdentity(item.data);
        if (seen.has(identity)) {
          duplicates.push({ row: item.row, kind: 'duplicate', values: item.values, issues: [] });
          continue;
        }
        seen.add(identity);
        let { groupTag } = item.data;
        if (groupTag) {
          const key = groupTag.toLocaleLowerCase('pt');
          groupTag = groups.get(key) ?? groupTag;
          groups.set(key, groupTag);
        }
        fresh.push({ ...item.data, groupTag });
      }

      const report: ImportReport = {
        problems: [...invalid, ...duplicates]
          .sort((a, b) => a.row - b.row)
          .slice(0, IMPORT_LIMITS.reportedProblems),
        invalid: invalid.length,
      };
      const room = Math.max(0, event.guestLimit - existing.length);
      if (fresh.length > room) {
        await tx.guestImport.update({
          where: { id: importId },
          data: {
            status: 'FAILED',
            failure: 'limit',
            importedCount: 0,
            duplicateCount: duplicates.length,
            report: { ...report, wanted: fresh.length, room },
          },
        });
        return { status: 'FAILED', failure: 'limit' };
      }

      if (fresh.length > 0) {
        await tx.guest.createMany({
          data: fresh.map((guest) => ({
            ...guest,
            eventId: job.eventId,
            token: createGuestToken(),
          })),
        });
      }
      await tx.guestImport.update({
        where: { id: importId },
        data: { importedCount: fresh.length, duplicateCount: duplicates.length, report },
      });
      return {
        status: 'DONE',
        imported: fresh.length,
        duplicates: duplicates.length,
        invalid: invalid.length,
      };
    },
    { timeout: 30_000 },
  );

  if (outcome.status !== 'skipped') {
    logger.info('Guest import finished', { importId, eventId: job.eventId, totalRows, ...outcome });
  }
  return outcome;
}

/**
 * For the worker (every few minutes): imports still waiting after a couple of minutes lost their
 * job (Redis restarted, worker stopped): queued again; after a day, given up.
 */
export async function sweepGuestImports(
  options: { now?: Date; requeue?: (importId: string) => Promise<void> } = {},
): Promise<{ requeued: number; abandoned: number }> {
  const now = (options.now ?? new Date()).getTime();
  const requeue = options.requeue ?? requeueGuestImport;
  const stale = await getPrisma().guestImport.findMany({
    where: { status: 'PENDING', createdAt: { lt: new Date(now - STALE_PENDING_MS) } },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  let requeued = 0;
  let abandoned = 0;
  for (const item of stale) {
    if (item.createdAt.getTime() < now - ABANDONED_PENDING_MS) {
      if (await failImport(item.id, 'error')) abandoned += 1;
    } else {
      await requeue(item.id);
      requeued += 1;
    }
  }
  return { requeued, abandoned };
}

const importViewSelect = {
  id: true,
  status: true,
  fileName: true,
  totalRows: true,
  importedCount: true,
  duplicateCount: true,
  failure: true,
  report: true,
} as const;

/** One import of the event, for the dialog; null when it is not this event's. */
export async function loadGuestImport(
  event: EventRef,
  importId: string,
): Promise<GuestImportView | null> {
  const row = await getPrisma().guestImport.findFirst({
    where: { id: importId, eventId: event.id },
    select: importViewSelect,
  });
  if (!row) return null;
  const report = parseImportReport(row.report);
  const problems = report.problems.slice(0, SHOWN_PROBLEMS);
  return {
    id: row.id,
    status: row.status,
    fileName: row.fileName,
    totalRows: row.totalRows,
    imported: row.importedCount ?? 0,
    duplicates: row.duplicateCount ?? 0,
    invalid: report.invalid,
    failure: row.status === 'FAILED' ? (toImportFailure(row.failure) ?? 'error') : null,
    wanted: report.wanted ?? null,
    room: report.room ?? null,
    problems,
    moreProblems: report.invalid + (row.duplicateCount ?? 0) - problems.length,
  };
}

/** Every row the import could not take, for the "linhas com erros" download. */
export async function loadImportProblems(
  event: EventRef,
  importId: string,
): Promise<ImportProblem[] | null> {
  const row = await getPrisma().guestImport.findFirst({
    where: { id: importId, eventId: event.id },
    select: { report: true },
  });
  return row ? parseImportReport(row.report).problems : null;
}
