import { access } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { invitationEventFixture } from '@/features/invitation/test-fixtures';
import { DEFAULT_THEME_ID, THEMES } from '@/themes';

import { OG_SIZE, ogFontsFor, renderInvitationOgImage } from './og-image';

const themeIds = Object.keys(THEMES);

describe('link preview image', () => {
  it.each(themeIds)('has the font files of the "%s" theme', async (themeId) => {
    const fonts = ogFontsFor(themeId);
    for (const { file } of fonts.files) {
      await expect(access(path.join(process.cwd(), 'assets', 'fonts', file))).resolves.toBe(
        undefined,
      );
    }
    // Every family the image asks for is one of the registered files.
    const names = new Set(fonts.files.map((font) => font.name));
    for (const family of [fonts.script, fonts.caps].flatMap((list) => list.split(', '))) {
      expect(names).toContain(family.replaceAll('"', ''));
    }
  });

  it("uses the default theme's fonts for an unknown theme", () => {
    expect(ogFontsFor('does-not-exist')).toBe(ogFontsFor(DEFAULT_THEME_ID));
  });

  it.each(themeIds)(
    'draws a small JPEG in the "%s" theme',
    async (themeId) => {
      const jpeg = await renderInvitationOgImage(invitationEventFixture({ themeId }));
      const { format, width, height } = await sharp(jpeg).metadata();
      expect({ format, width, height }).toEqual({ format: 'jpeg', ...OG_SIZE });
      // WhatsApp drops large preview images.
      expect(jpeg.length).toBeLessThan(300 * 1024);
    },
    20_000,
  );
});
