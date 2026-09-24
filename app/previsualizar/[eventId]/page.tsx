import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';

import { PreviewRefresher } from '@/features/dashboard/editor/preview-refresher';
import { InvitationView } from '@/features/invitation/invitation-view';
import { editor } from '@/i18n/pt-AO';
import { serverNow } from '@/lib/clock';
import { requireEditableEvent } from '@/server/events/access';
import { loadPreviewEvent } from '@/server/events/editor';
import { getTheme } from '@/themes';

export const metadata: Metadata = {
  title: editor.preview.title,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { colorScheme: 'light' };

type Props = PageProps<'/previsualizar/[eventId]'>;

/**
 * The invitation as guests will see it, with the couple's unsaved changes (the editor's live
 * preview, shown in an iframe). A sample guest; nothing is recorded or sent. `?envelope=1` starts
 * with the opening envelope.
 */
export default async function PreviewPage({ params, searchParams }: Props) {
  const { eventId } = await params;
  const { user, event } = await requireEditableEvent(eventId);
  const invitationEvent = await loadPreviewEvent(event.id, user.id);
  if (!invitationEvent) notFound();
  const { envelope } = await searchParams;

  return (
    <>
      <PreviewRefresher />
      <InvitationView
        invitation={{
          event: invitationEvent,
          guest: { id: 'preview', displayName: editor.preview.sampleGuest, seatsAllowed: 2 },
        }}
        rsvp={null}
        theme={getTheme(invitationEvent.themeId)}
        now={serverNow()}
        guestToken=""
        basePath=""
        preview={{ showEnvelope: envelope === '1' }}
      />
    </>
  );
}
