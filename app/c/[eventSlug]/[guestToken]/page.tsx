import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { after } from 'next/server';

import { getServerEnv } from '@/env';
import { InvitationView } from '@/features/invitation/invitation-view';
import { invitationDescription, invitationTitle } from '@/features/invitation/metadata';
import { acceptsForm } from '@/features/invitation/rsvp/rules';
import type { Invitation } from '@/features/invitation/types';
import { t } from '@/i18n';
import { isBotUserAgent } from '@/lib/bots';
import { serverNow } from '@/lib/clock';
import { logger } from '@/lib/logger';
import { NONCE_HEADER } from '@/lib/security/csp';
import { invitationParamsSchema } from '@/lib/validation/invitation';
import { getInvitation } from '@/server/invitations/queries';
import { recordInvitationView } from '@/server/invitations/views';
import { getGuestRsvp } from '@/server/rsvp/rsvp-service';
import { getTheme, resolveThemeColors } from '@/themes';

type Props = PageProps<'/c/[eventSlug]/[guestToken]'>;

/** Validated params, then the (per-request deduplicated) invitation lookup. */
async function load(params: Props['params']): Promise<Invitation | null> {
  const parsed = invitationParamsSchema.safeParse(await params);
  return parsed.success ? getInvitation(parsed.data.eventSlug, parsed.data.guestToken) : null;
}

/** WhatsApp link preview. The image comes from ./opengraph-image.tsx. Never indexed. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  const robots = { index: false, follow: false };
  if (!data) return { title: { absolute: t.invitation.notFound.title }, robots };

  const title = invitationTitle(data.event);
  const description = invitationDescription(data.event);
  return {
    metadataBase: new URL(getServerEnv().APP_URL),
    title: { absolute: title },
    description,
    robots,
    openGraph: { title, description, type: 'website', locale: 'pt_AO', siteName: t.app.name },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const data = await load(params);
  const theme = getTheme(data?.event.themeId);
  return {
    themeColor: resolveThemeColors(theme, data?.event.themeOverrides).background,
    colorScheme: 'light',
  };
}

/** A guest's personal invitation: /c/<eventSlug>/<guestToken>. */
export default async function InvitationPage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();

  const { eventSlug, guestToken } = await params;
  const requestHeaders = await headers();
  const rsvp = acceptsForm(data.event) ? await getGuestRsvp(data.guest.id) : null;

  // "Opened", at most once an hour, after the response is sent; link previews do not count.
  if (!isBotUserAgent(requestHeaders.get('user-agent'))) {
    const guestId = data.guest.id;
    after(async () => {
      try {
        await recordInvitationView(guestId);
      } catch (err) {
        logger.error('Could not record an invitation view', { err, guestId });
      }
    });
  }

  return (
    <InvitationView
      invitation={data}
      rsvp={rsvp}
      theme={getTheme(data.event.themeId)}
      now={serverNow()}
      guestToken={guestToken}
      basePath={`/c/${eventSlug}/${guestToken}`}
      nonce={requestHeaders.get(NONCE_HEADER) ?? undefined}
    />
  );
}
