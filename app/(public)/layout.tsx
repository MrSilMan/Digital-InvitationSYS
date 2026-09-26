import type { Metadata } from 'next';

import { getServerEnv } from '@/env';

/**
 * Only sets the base URL of the link preview image (./opengraph-image.tsx), shared by the landing
 * page, the theme demos and the login. Next.js resolves that file's URL before the pages' own
 * metadata (see app/c/[eventSlug]/[guestToken]/layout.tsx). Every page renders per request (the
 * root layout reads the headers): reading the environment here never runs during `next build`.
 */
export function generateMetadata(): Metadata {
  return { metadataBase: new URL(getServerEnv().APP_URL) };
}

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return children;
}
