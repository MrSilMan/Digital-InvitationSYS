/**
 * Draws the placeholder artwork of the themes and saves it as optimized WebP files in
 * public/themes/<theme>/, at the exact sizes the themes expect (see README → Themes).
 * The real, licensed artwork replaces these files one for one.
 *
 *   npm run themes:placeholders                                # missing files of every theme
 *   npm run themes:placeholders -- --theme=champanhe           # missing files of one theme
 *   npm run themes:placeholders -- --theme=champanhe --force   # redraws that theme's files
 *
 * --force only works with --theme, and must never be used once the theme's real artwork is in.
 * Deterministic: seeded random generators make every run produce the same images.
 */
import { access, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isThemeId, THEMES, type ThemeId } from '@/themes';

import { champanheArtwork } from './theme-placeholders/champanhe';
import { praiaRosaArtwork } from './theme-placeholders/praia-rosa';
import type { ArtworkFile } from './theme-placeholders/shared';

/** Every theme's placeholder files (TypeScript requires an entry for each theme). */
const ARTWORK: Record<ThemeId, readonly ArtworkFile[]> = {
  'praia-rosa': praiaRosaArtwork,
  champanhe: champanheArtwork,
};

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const themeArg = args.find((arg) => arg.startsWith('--theme='))?.slice('--theme='.length);

function usageError(message: string): never {
  console.error(message);
  process.exit(1);
}

function selectedThemes(): ThemeId[] {
  const all = Object.keys(THEMES).filter(isThemeId);
  if (themeArg === undefined) {
    if (FORCE) usageError('--force redraws one theme at a time: add --theme=<id>.');
    return all;
  }
  if (!isThemeId(themeArg)) usageError(`Unknown theme "${themeArg}". Themes: ${all.join(', ')}.`);
  return [themeArg];
}

/** Existing files may be the licensed artwork: they are only replaced with --force. */
async function shouldWrite(target: string, label: string): Promise<boolean> {
  if (FORCE) return true;
  try {
    await access(target);
  } catch {
    return true;
  }
  console.log(`${label.padEnd(36)} kept (already exists; --force redraws it)`);
  return false;
}

async function main(): Promise<void> {
  for (const themeId of selectedThemes()) {
    const outDir = path.join(process.cwd(), 'public', 'themes', themeId);
    await mkdir(outDir, { recursive: true });
    for (const artwork of ARTWORK[themeId]) {
      const target = path.join(outDir, artwork.file);
      const label = `${themeId}/${artwork.file}`;
      if (!(await shouldWrite(target, label))) continue;
      await writeFile(target, await artwork.render());
      const { size } = await stat(target);
      console.log(
        `${label.padEnd(36)} ${artwork.width}×${artwork.height}  ${Math.round(size / 1024)} KB`,
      );
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
