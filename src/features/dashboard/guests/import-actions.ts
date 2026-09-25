'use server';

import { z } from 'zod';

import { IMPORT_LIMITS } from '@/lib/guests/import';
import { logger } from '@/lib/logger';
import { auditDashboardChange } from '@/server/audit/audit-log';
import { authorizeEventAction } from '@/server/events/access';
import { decodeCsvBytes } from '@/server/guests/csv';
import { createGuestImport, loadGuestImport, runGuestImport } from '@/server/guests/import';
import { listGuests } from '@/server/guests/queries';
import { enqueueGuestImport } from '@/server/queues/guest-queue';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

import type { GuestErrorCode, GuestImportView, GuestListItem } from './types';

/**
 * CSV import of guests. The file comes in a Server Action (FormData, well under the 1 MB body
 * limit), is checked and stored as text, then imported by the worker; when Redis is down the
 * import runs here instead (a small file, the same code). Session, owner, rate limit and input are
 * checked first, as everywhere.
 */

export type ImportErrorCode = GuestErrorCode | 'type' | 'size' | 'empty';
export type ImportActionResult<T> = ({ ok: true } & T) | { ok: false; error: ImportErrorCode };

const importIdSchema = z.uuid();
/** What browsers and spreadsheets call a CSV file (some send nothing, or Excel's type). */
const CSV_TYPES = ['', 'text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'];
const CSV_NAME = /\.(csv|txt)$/i;

export async function startGuestImport(
  eventId: unknown,
  formData: unknown,
): Promise<ImportActionResult<{ import: GuestImportView }>> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return auth;
  const limit = await rateLimit(RATE_LIMITS.guestImportsPerUser, auth.user.id);
  if (!limit.allowed) return { ok: false, error: 'rate-limited' };

  const file = formData instanceof FormData ? formData.get('ficheiro') : null;
  if (!(file instanceof File)) return { ok: false, error: 'invalid' };
  if (!CSV_NAME.test(file.name) || !CSV_TYPES.includes(file.type)) {
    return { ok: false, error: 'type' };
  }
  if (file.size === 0) return { ok: false, error: 'empty' };
  if (file.size > IMPORT_LIMITS.maxBytes) return { ok: false, error: 'size' };

  const { event, user } = auth;
  try {
    const content = decodeCsvBytes(new Uint8Array(await file.arrayBuffer()));
    const importId = await createGuestImport(event, {
      userId: user.id,
      fileName: file.name.slice(0, 200),
      content,
    });
    const queued = await enqueueGuestImport(importId);
    logger.info('Guest import started', {
      eventId: event.id,
      importId,
      sizeBytes: file.size,
      queued,
    });
    await auditDashboardChange(user, event, 'guest.import', { importId });
    if (!queued) await runGuestImport(importId);
    const view = await loadGuestImport(event, importId);
    return view ? { ok: true, import: view } : { ok: false, error: 'not-found' };
  } catch (err) {
    logger.error('Guest import could not start', { err, eventId: event.id });
    return { ok: false, error: 'unavailable' };
  }
}

/** The import's progress (the dialog asks every few seconds while it waits). */
export async function getGuestImport(
  eventId: unknown,
  importId: unknown,
): Promise<ImportActionResult<{ import: GuestImportView }>> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return auth;
  const id = importIdSchema.safeParse(importId);
  if (!id.success) return { ok: false, error: 'invalid' };
  try {
    const view = await loadGuestImport(auth.event, id.data);
    return view ? { ok: true, import: view } : { ok: false, error: 'not-found' };
  } catch (err) {
    logger.error('Guest import status failed', { err, eventId: auth.event.id });
    return { ok: false, error: 'unavailable' };
  }
}

/** The whole list again, after an import added guests. */
export async function listEventGuests(
  eventId: unknown,
): Promise<ImportActionResult<{ guests: GuestListItem[] }>> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return auth;
  try {
    return { ok: true, guests: await listGuests(auth.event) };
  } catch (err) {
    logger.error('Guest list could not be loaded', { err, eventId: auth.event.id });
    return { ok: false, error: 'unavailable' };
  }
}
