import 'server-only';

import { ImageResponse } from 'next/og';
import sharp from 'sharp';

import {
  OG_SIZE,
  ogFontsFor,
  ogThemeArtwork,
  ogThemeFonts,
} from '@/features/invitation/og/og-image';
import { app, landing } from '@/i18n/pt-AO';
import { THEMES } from '@/themes';

/**
 * The landing page's link preview image (WhatsApp, social networks): the wordmark in gold on the
 * night sky, between two of Champanhe's corner florals, in the landing page's fonts. A JPEG of
 * about 100 KB, like the invitations' (WhatsApp drops large preview images).
 */

const NIGHT = '#121826';
const GOLD = '#d9b56c';
const IVORY = '#f5efe3';
const MUTED = '#c5cad6';
const ROSE = '#f0a6c2';

export async function renderLandingOgImage(): Promise<Buffer> {
  const theme = THEMES.champanhe;
  const fonts = ogFontsFor(theme.id);
  const [fontData, art] = await Promise.all([ogThemeFonts(theme), ogThemeArtwork(theme)]);
  // Two centred lines under the wordmark: all three highlights on one line are wider than the image.
  const { items } = landing.ribbon;
  const promise = items[0];
  const details = [items[1], items[6]].filter(Boolean).join('  ·  ');

  const response = new ImageResponse(
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        position: 'relative',
        backgroundColor: NIGHT,
        backgroundImage:
          'radial-gradient(circle at 85% 0%, rgba(217, 181, 108, 0.28), rgba(18, 24, 38, 0) 55%), radial-gradient(circle at 0% 100%, rgba(240, 166, 194, 0.2), rgba(18, 24, 38, 0) 50%)',
        color: IVORY,
      }}
    >
      {art.cornerTopLeft ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>.
        <img
          src={art.cornerTopLeft}
          alt=""
          width={340}
          height={340}
          style={{ position: 'absolute', top: -50, left: -50 }}
        />
      ) : null}
      {art.cornerBottomRight ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>.
        <img
          src={art.cornerBottomRight}
          alt=""
          width={340}
          height={340}
          style={{ position: 'absolute', bottom: -50, right: -50 }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: fonts.script,
            fontSize: 168,
            lineHeight: 1.3,
            color: GOLD,
          }}
        >
          {app.name}
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: fonts.caps,
            fontWeight: 500,
            fontSize: 32,
            letterSpacing: 3,
            color: IVORY,
          }}
        >
          {promise}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 10,
            fontFamily: fonts.caps,
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: 2,
            color: MUTED,
          }}
        >
          {details}
        </div>
        <div
          style={{ marginTop: 34, width: 120, height: 3, borderRadius: 3, backgroundColor: ROSE }}
        />
      </div>
    </div>,
    { ...OG_SIZE, fonts: fontData },
  );

  const png = Buffer.from(await response.arrayBuffer());
  return sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}
