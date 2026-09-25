import type { Metadata } from 'next';

import { getServerEnv } from '@/env';

/**
 * Only sets the base URL of the WhatsApp preview image (./opengraph-image.tsx). Next.js resolves
 * that file's URL before the page's own metadata, so a `metadataBase` in page.tsx alone leaves a
 * warning on every request. Guest links always render per request: reading the environment here
 * never runs during `next build`.
 */
export function generateMetadata(): Metadata {
  return { metadataBase: new URL(getServerEnv().APP_URL) };
}

export default function InvitationLayout({ children }: LayoutProps<'/c/[eventSlug]/[guestToken]'>) {
  return children;
}
