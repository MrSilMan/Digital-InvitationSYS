import { Cormorant_SC, EB_Garamond, Ephesis } from 'next/font/google';

import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from '.';

/**
 * Fonts used by the invitation themes. Only the weights we render are downloaded, and next/font
 * self-hosts them (no request to Google from the guest's phone).
 * Chosen by comparing candidates with the reference on /design
 * (`src/features/design-preview/candidate-fonts.ts`):
 * - Ephesis: thin, relaxed brush-pen script, closest to the reference titles and names;
 * - Cormorant SC: true small caps like "Com a benção de Deus";
 * - EB Garamond: sturdy, readable body text on small screens.
 */

export const scriptFont = Ephesis({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-script',
});

export const capsFont = Cormorant_SC({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-caps',
});

export const bodyFont = EB_Garamond({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-body',
});

/** The next/font classes that declare each theme's `--font-theme-*` variables. */
const FONT_CLASS_NAMES: Record<ThemeId, string> = {
  'praia-rosa': [scriptFont.variable, capsFont.variable, bodyFont.variable].join(' '),
};

/** Font classes for a theme root; unknown IDs get the default theme's fonts, like getTheme. */
export function themeFontClassName(themeId: string): string {
  return FONT_CLASS_NAMES[isThemeId(themeId) ? themeId : DEFAULT_THEME_ID];
}

/** Family names of the fonts above (shown on /design). */
export const THEME_FONT_NAMES = {
  script: 'Ephesis',
  caps: 'Cormorant SC',
  body: 'EB Garamond',
} as const;
