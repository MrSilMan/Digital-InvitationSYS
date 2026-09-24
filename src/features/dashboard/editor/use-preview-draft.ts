'use client';

import { useCallback, useEffect, useRef } from 'react';
import { type Control, useWatch } from 'react-hook-form';

import type { EventEditorData, EventEditorValues } from '@/lib/validation/event-editor';

import { savePreviewDraft } from './actions';

const DEBOUNCE_MS = 700;

/**
 * Sends the unsaved form values to the server (Redis) a moment after the couple stops typing, so
 * the preview can render them; then calls `onSynced` (refresh the preview) or `onFailed`.
 * `markSynced` records values the server already has (the saved ones), so nothing is sent for them.
 */
export function usePreviewDraft({
  eventId,
  control,
  initial,
  onSynced,
  onFailed,
}: {
  eventId: string;
  control: Control<EventEditorValues, unknown, EventEditorData>;
  initial: EventEditorValues;
  onSynced: () => void;
  onFailed: () => void;
}) {
  const values = useWatch({ control });
  const lastSent = useRef(JSON.stringify(initial));
  const callbacks = useRef({ onSynced, onFailed });
  useEffect(() => {
    callbacks.current = { onSynced, onFailed };
  });

  useEffect(() => {
    const serialized = JSON.stringify(values);
    if (serialized === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = serialized;
      savePreviewDraft(eventId, JSON.parse(serialized))
        .then((result) => (result.ok ? callbacks.current.onSynced() : callbacks.current.onFailed()))
        .catch(() => callbacks.current.onFailed());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values, eventId]);

  const markSynced = useCallback((synced: EventEditorValues) => {
    lastSent.current = JSON.stringify(synced);
  }, []);

  return { markSynced };
}
