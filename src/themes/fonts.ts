import { Cinzel, Cormorant_SC, EB_Garamond, Ephesis, Great_Vibes } from 'next/font/google';

import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from '.';

/**
 * Fonts used by the invitation themes. Only the weights we render are downloaded, and next/font
 * self-hosts them (no request to Google from the guest's phone). Each theme has its own script and
 * small-caps fonts; the body font is shared. Chosen by comparing candidates on /design
 * (`src/features/design-preview/candidate-fonts.ts`).
 *
 * Preloading: Next.js preloads every font that a route's modules import, whatever the theme of the
 * page, so preloaded theme fonts would be downloaded by every guest. Only the shared body font is
 * preloaded; the script and caps fonts load when the page first uses them, while the guest looks
 * at the envelope (`display: swap` shows a fallback until they arrive).
 */

/** Body text of every theme: sturdy, readable on small screens. */
const bodyFont = EB_Garamond({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-body',
});

/** Praia Rosa: thin, relaxed brush-pen script, closest to the reference titles and names. */
const praiaRosaScript = Ephesis({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-theme-script',
});

/** Praia Rosa: true small caps, like "Com a benção de Deus" in the reference. */
const praiaRosaCaps = Cormorant_SC({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-theme-caps',
});

/** Champanhe: formal calligraphic script, like gold-foil stationery. */
const champanheScript = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-theme-script',
});

/** Champanhe: engraved Roman capitals; lower case is drawn as small capitals. */
const champanheCaps = Cinzel({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-theme-caps',
});

interface ThemeFontSet {
  /** next/font classes that declare the theme's `--font-theme-*` variables. */
  className: string;
  /** Family names (shown on /design). */
  names: { script: string; caps: string; body: string };
}

const THEME_FONTS: Record<ThemeId, ThemeFontSet> = {
  'praia-rosa': {
    className: [praiaRosaScript.variable, praiaRosaCaps.variable, bodyFont.variable].join(' '),
    names: { script: 'Ephesis', caps: 'Cormorant SC', body: 'EB Garamond' },
  },
  champanhe: {
    className: [champanheScript.variable, champanheCaps.variable, bodyFont.variable].join(' '),
    names: { script: 'Great Vibes', caps: 'Cinzel', body: 'EB Garamond' },
  },
};

function themeFonts(themeId: string): ThemeFontSet {
  return THEME_FONTS[isThemeId(themeId) ? themeId : DEFAULT_THEME_ID];
}

/** Font classes for a theme root; unknown IDs get the default theme's fonts, like getTheme. */
export function themeFontClassName(themeId: string): string {
  return themeFonts(themeId).className;
}

/** Family names of a theme's fonts. */
export function themeFontNames(themeId: string): ThemeFontSet['names'] {
  return themeFonts(themeId).names;
}
