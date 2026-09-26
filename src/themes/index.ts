import type { CSSProperties } from 'react';

import { champanhe } from './champanhe';
import { imbondeiro } from './imbondeiro';
import { jardim } from './jardim';
import type { ThemeOverrides } from './overrides';
import { praiaRosa } from './praia-rosa';
import type { Decoration, ThemeArea, ThemeColors, ThemeDefinition } from './types';

export type { Decoration, ThemeArea, ThemeColors, ThemeDefinition } from './types';

/** Every available theme (README → Themes → Adding a theme). */
export const THEMES = {
  'praia-rosa': praiaRosa,
  champanhe,
  jardim,
  imbondeiro,
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeId = keyof typeof THEMES;

export const DEFAULT_THEME_ID: ThemeId = 'praia-rosa';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && Object.hasOwn(THEMES, value);
}

/** The theme for `Event.themeId`; unknown IDs fall back to the default theme. */
export function getTheme(id: string | null | undefined): ThemeDefinition {
  return THEMES[isThemeId(id) ? id : DEFAULT_THEME_ID];
}

export function decorationsFor(theme: ThemeDefinition, area: ThemeArea): readonly Decoration[] {
  return theme.decorations[area] ?? theme.decorations.default;
}

/** The theme's colours with the couple's overrides applied. */
export function resolveThemeColors(
  theme: ThemeDefinition,
  overrides: ThemeOverrides = {},
): ThemeColors {
  return { ...theme.colors, ...overrides.colors };
}

/**
 * The CSS variables a theme root sets. Tailwind's theme tokens (app/globals.css) read them, so
 * `text-script`, `bg-accent`, `font-caps`… follow the theme and the couple's overrides.
 */
export function themeCssVariables(
  theme: ThemeDefinition,
  overrides: ThemeOverrides = {},
): CSSProperties {
  const colors = resolveThemeColors(theme, overrides);
  return {
    '--theme-background': colors.background,
    '--theme-ink': colors.ink,
    '--theme-muted': colors.muted,
    '--theme-script': colors.script,
    '--theme-accent': colors.accent,
    '--theme-accent-contrast': colors.accentContrast,
    '--theme-line': colors.line,
    '--theme-envelope-paper': theme.envelope.paper,
    '--theme-envelope-shade': theme.envelope.shade,
    '--theme-seal': theme.envelope.seal,
    '--theme-seal-ink': theme.envelope.sealInk,
    '--theme-font-script': theme.fonts.script,
    '--theme-font-caps': theme.fonts.caps,
    '--theme-font-body': theme.fonts.body,
    '--theme-caps-size-adjust':
      theme.fonts.capsSizeAdjust === undefined ? 'none' : String(theme.fonts.capsSizeAdjust),
    '--theme-script-size-adjust':
      theme.fonts.scriptSizeAdjust === undefined ? 'none' : String(theme.fonts.scriptSizeAdjust),
    '--theme-texture': theme.texture ? `url("${theme.texture.src}")` : 'none',
  } as CSSProperties;
}
