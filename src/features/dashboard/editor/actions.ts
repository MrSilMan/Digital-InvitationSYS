'use server';

import { z } from 'zod';

import { logger } from '@/lib/logger';
import { type EventEditorValues, eventEditorSchema } from '@/lib/validation/event-editor';
import { auditDashboardChange } from '@/server/audit/audit-log';
import { getSessionUser } from '@/server/auth/session';
import {
  deletePreviewDraft,
  DRAFT_MAX_BYTES,
  loadEventRow,
  saveEventEditorData,
  savePreviewDraftValues,
  toEditorValues,
} from '@/server/events/editor';
import { authorizeEventAction } from '@/server/events/access';
import { resolveShortMapsLink } from '@/server/maps/resolve-short-link';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

export type EditorErrorCode =
  'invalid' | 'unauthenticated' | 'not-found' | 'rate-limited' | 'unavailable';

export interface FieldIssue {
  /** Dotted form path, e.g. "venues.0.venueName". */
  path: string;
  message: string;
}

export type SaveEventResult =
  | { ok: true; values: EventEditorValues; savedAt: string }
  | { ok: false; error: EditorErrorCode; issues?: FieldIssue[] };

/**
 * Saves the editor. Nothing from the browser is trusted: the session, the event's owner, the rate
 * limit and every field are checked here. Returns the stored values (normalized: trimmed texts,
 * formatted phones and IBAN) so the form matches the database. An admin's save of a couple's event
 * is recorded in the audit log.
 */
export async function saveEvent(eventId: unknown, input: unknown): Promise<SaveEventResult> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return { ok: false, error: auth.error };
  const { user, event } = auth;

  const limit = await rateLimit(RATE_LIMITS.eventSavesPerUser, user.id);
  if (!limit.allowed) return { ok: false, error: 'rate-limited' };

  const parsed = eventEditorSchema.safeParse(input);
  if (!parsed.success) {
    logger.info('Event save rejected: invalid values', {
      eventId: event.id,
      fields: parsed.error.issues.map((issue) => issue.path.join('.')).slice(0, 20),
    });
    return {
      ok: false,
      error: 'invalid',
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  try {
    await saveEventEditorData(event, parsed.data);
    await auditDashboardChange(user, event, 'event.edit');
    await deletePreviewDraft(event.id, user.id);
    const row = await loadEventRow(event.id);
    if (!row) return { ok: false, error: 'not-found' };
    logger.info('Event saved', { eventId: event.id });
    return { ok: true, values: toEditorValues(row), savedAt: new Date().toISOString() };
  } catch (err) {
    logger.error('Event save failed', { err, eventId: event.id });
    return { ok: false, error: 'unavailable' };
  }
}

export type PreviewDraftResult = { ok: true } | { ok: false; error: EditorErrorCode };

/**
 * Keeps the unsaved form values for the live preview (Redis, 2 hours). They are validated when the
 * preview reads them; here only the size is limited.
 */
export async function savePreviewDraft(
  eventId: unknown,
  values: unknown,
): Promise<PreviewDraftResult> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return { ok: false, error: auth.error };
  const limit = await rateLimit(RATE_LIMITS.previewDraftsPerUser, auth.user.id);
  if (!limit.allowed) return { ok: false, error: 'rate-limited' };
  if (typeof values !== 'object' || values === null) return { ok: false, error: 'invalid' };
  if (JSON.stringify(values).length > DRAFT_MAX_BYTES) return { ok: false, error: 'invalid' };
  const stored = await savePreviewDraftValues(auth.event.id, auth.user.id, values);
  return stored ? { ok: true } : { ok: false, error: 'unavailable' };
}

/** Drops the unsaved changes from the preview (after "Descartar alterações"). */
export async function discardPreviewDraft(eventId: unknown): Promise<PreviewDraftResult> {
  const auth = await authorizeEventAction(eventId);
  if (!auth.ok) return { ok: false, error: auth.error };
  await deletePreviewDraft(auth.event.id, auth.user.id);
  return { ok: true };
}

export type ResolveMapsLinkResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: true; latitude: null; longitude: null }
  | { ok: false; error: 'invalid' | 'unavailable' | 'rate-limited' | 'unauthenticated' };

/** Reads the coordinates behind a Google Maps share link (maps.app.goo.gl/…). */
export async function resolveMapsLink(link: unknown): Promise<ResolveMapsLinkResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: 'unauthenticated' };
  const url = z.string().trim().max(2048).safeParse(link);
  if (!url.success) return { ok: false, error: 'invalid' };
  const limit = await rateLimit(RATE_LIMITS.mapsLinksPerUser, user.id);
  if (!limit.allowed) return { ok: false, error: 'rate-limited' };

  const result = await resolveShortMapsLink(url.data);
  if (!result.ok) return result;
  return result.coordinates
    ? { ok: true, ...result.coordinates }
    : { ok: true, latitude: null, longitude: null };
}
