import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EventEditor } from '@/features/dashboard/editor/event-editor';
import { editor } from '@/i18n/pt-AO';
import { requireEditableEvent } from '@/server/events/access';
import { deletePreviewDraft, loadEventRow, toEditorValues } from '@/server/events/editor';

export const metadata: Metadata = { title: editor.title };

/** The event editor (couple or admin). Opens on the saved version: leftover drafts are dropped. */
export default async function EditEventPage({ params }: PageProps<'/painel/eventos/[eventId]'>) {
  const { eventId } = await params;
  const { user, event } = await requireEditableEvent(eventId);
  const [row] = await Promise.all([loadEventRow(event.id), deletePreviewDraft(event.id, user.id)]);
  if (!row) notFound();

  return (
    <EventEditor
      eventId={event.id}
      title={`${row.groomName} & ${row.brideName}`}
      initialValues={toEditorValues(row)}
    />
  );
}
