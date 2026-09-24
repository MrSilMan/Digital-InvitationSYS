import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';
import sharp, { type Sharp } from 'sharp';

import { dateParts } from '@/i18n/format';
import { invitation } from '@/i18n/pt-AO';
import { getTheme, resolveThemeColors, type ThemeDefinition } from '@/themes';

import { coupleNames } from '../text';
import type { InvitationEvent } from '../types';

/**
 * The WhatsApp link preview image: the theme's paper and florals, the monogram, the couple's names
 * and the date. Event-level only (no guest name). Rendered as PNG by next/og, then re-encoded as a
 * JPEG of about 100 KB, because WhatsApp drops large preview images.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const FONT_FILES = [
  { file: 'ephesis-latin-400-normal.woff', name: 'Ephesis', weight: 400 },
  { file: 'ephesis-latin-ext-400-normal.woff', name: 'Ephesis Ext', weight: 400 },
  { file: 'cormorant-sc-latin-500-normal.woff', name: 'Cormorant SC', weight: 500 },
  { file: 'cormorant-sc-latin-ext-500-normal.woff', name: 'Cormorant SC Ext', weight: 500 },
  { file: 'cormorant-sc-latin-700-normal.woff', name: 'Cormorant SC', weight: 700 },
  { file: 'cormorant-sc-latin-ext-700-normal.woff', name: 'Cormorant SC Ext', weight: 700 },
] as const;

const SCRIPT = '"Ephesis", "Ephesis Ext"';
const CAPS = '"Cormorant SC", "Cormorant SC Ext"';

let fonts: ReturnType<typeof loadFonts> | undefined;

function loadFonts() {
  return Promise.all(
    FONT_FILES.map(async ({ file, name, weight }) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(path.join(FONT_DIR, file)),
    })),
  );
}

const images = new Map<string, Promise<string>>();

/** A theme asset (public/themes/…) as a PNG data URL (next/og cannot draw WebP). Cached. */
function themeImage(
  src: string,
  prepare: (image: Sharp) => Sharp,
  cacheKey: string,
): Promise<string> {
  if (!/^\/themes\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(src)) {
    return Promise.reject(new Error(`Not a theme asset: ${src}`));
  }
  const key = `${src}#${cacheKey}`;
  const cached = images.get(key);
  if (cached) return cached;
  const image = prepare(sharp(path.join(PUBLIC_DIR, src)))
    .png()
    .toBuffer()
    .then((buffer) => `data:image/png;base64,${buffer.toString('base64')}`);
  images.set(key, image);
  return image;
}

async function themeArtwork(theme: ThemeDefinition) {
  const corner = theme.images.corner ?? theme.images[Object.keys(theme.images)[0] ?? ''];
  const [texture, cornerTopLeft, cornerBottomRight] = await Promise.all([
    theme.texture
      ? themeImage(
          theme.texture.src,
          (image) =>
            image
              .resize({ width: OG_SIZE.width })
              .extract({ left: 0, top: 0, width: OG_SIZE.width, height: OG_SIZE.height }),
          'og-texture',
        )
      : null,
    corner ? themeImage(corner.src, (image) => image.resize({ width: 340 }), 'og-corner') : null,
    corner
      ? themeImage(
          corner.src,
          (image) => image.resize({ width: 340 }).flip().flop(),
          'og-corner-br',
        )
      : null,
  ]);
  return { texture, cornerTopLeft, cornerBottomRight };
}

function Dot({ color }: { color: string }) {
  return (
    <div
      style={{ width: 13, height: 13, borderRadius: 13, backgroundColor: color, marginTop: 4 }}
    />
  );
}

export async function renderInvitationOgImage(event: InvitationEvent): Promise<Buffer> {
  const theme = getTheme(event.themeId);
  const colors = resolveThemeColors(theme, event.themeOverrides);
  fonts ??= loadFonts();
  const [fontData, art] = await Promise.all([fonts, themeArtwork(theme)]);
  const { day, month, year } = dateParts(new Date(event.startsAt));
  const [first = '', second = ''] = Array.from(event.monogram.toLocaleUpperCase('pt-AO'));
  const heading =
    event.phase === 'SAVE_THE_DATE'
      ? invitation.saveTheDate.title
      : invitation.metadata.imageHeading;

  const response = new ImageResponse(
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        position: 'relative',
        backgroundColor: colors.background,
        color: colors.ink,
      }}
    >
      {art.texture ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>.
        <img
          src={art.texture}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      ) : null}
      {art.cornerTopLeft ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>.
        <img
          src={art.cornerTopLeft}
          alt=""
          width={340}
          height={340}
          style={{ position: 'absolute', top: -40, left: -40 }}
        />
      ) : null}
      {art.cornerBottomRight ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>.
        <img
          src={art.cornerBottomRight}
          alt=""
          width={340}
          height={340}
          style={{ position: 'absolute', bottom: -40, right: -40 }}
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
            display: 'flex',
            fontFamily: CAPS,
            fontWeight: 500,
            fontSize: 104,
            lineHeight: 1,
            color: colors.accent,
          }}
        >
          <span>{first}</span>
          <span style={{ marginLeft: -30, marginTop: 14 }}>{second}</span>
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: CAPS,
            fontWeight: 500,
            fontSize: 34,
            letterSpacing: 6,
          }}
        >
          {heading.toLocaleUpperCase('pt-AO')}
        </div>
        <div style={{ fontFamily: SCRIPT, fontSize: 128, lineHeight: 1.25, color: colors.script }}>
          {coupleNames(event)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            fontFamily: CAPS,
            fontWeight: 700,
            fontSize: 46,
          }}
        >
          <span>{day}</span>
          <Dot color={colors.accent} />
          <span>{month.toLocaleUpperCase('pt-AO')}</span>
          <Dot color={colors.accent} />
          <span>{year}</span>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: fontData },
  );

  const png = Buffer.from(await response.arrayBuffer());
  return sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}
