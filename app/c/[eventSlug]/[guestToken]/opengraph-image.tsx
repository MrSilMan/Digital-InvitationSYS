import { OG_SIZE, renderInvitationOgImage } from '@/features/invitation/og/og-image';
import { t } from '@/i18n';
import { invitationParamsSchema } from '@/lib/validation/invitation';
import { getInvitation } from '@/server/invitations/queries';

/** WhatsApp link preview image (the page's og:image). Only for a valid guest link. */

export const alt = t.invitation.metadata.imageAlt;
export const size = OG_SIZE;
export const contentType = 'image/jpeg';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ eventSlug: string; guestToken: string }>;
}) {
  const parsed = invitationParamsSchema.safeParse(await params);
  const data = parsed.success
    ? await getInvitation(parsed.data.eventSlug, parsed.data.guestToken)
    : null;
  if (!data) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  const jpeg = await renderInvitationOgImage(data.event);
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      // Event-level picture (no guest data): link previews may cache it for an hour.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
