import { OG_SIZE } from '@/features/invitation/og/og-image';
import { renderLandingOgImage } from '@/features/landing/og-image';
import { landing } from '@/i18n/pt-AO';

/** Link preview image of the landing page, the theme demos and the login (no event data). */

export const alt = landing.metadata.imageAlt;
export const size = OG_SIZE;
export const contentType = 'image/jpeg';

export default async function OpenGraphImage() {
  const jpeg = await renderLandingOgImage();
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
  });
}
