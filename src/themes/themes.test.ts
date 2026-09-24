import { describe, expect, it } from 'vitest';

import {
  DEFAULT_THEME_ID,
  decorationsFor,
  getTheme,
  isThemeId,
  THEMES,
  themeCssVariables,
} from '@/themes';
import { contrastRatio, relativeLuminance } from '@/themes/contrast';

describe('contrast maths', () => {
  it('matches the WCAG reference values', () => {
    expect(relativeLuminance('#ffffff')).toBe(1);
    expect(relativeLuminance('#000000')).toBe(0);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });

  it('rejects anything but #RRGGBB', () => {
    expect(() => relativeLuminance('#fff')).toThrow();
    expect(() => relativeLuminance('red')).toThrow();
  });
});

describe.each(Object.values(THEMES).map((theme) => [theme.name, theme] as const))(
  'theme %s',
  (_name, theme) => {
    const { colors } = theme;

    it('keeps text readable on the page (WCAG AA)', () => {
      expect(contrastRatio(colors.ink, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.muted, colors.background)).toBeGreaterThanOrEqual(4.5);
      // Script is only used for large titles and names: the large-text minimum applies.
      expect(contrastRatio(colors.script, colors.background)).toBeGreaterThanOrEqual(3);
    });

    it('keeps button labels readable, and buttons, icons and lines visible', () => {
      expect(contrastRatio(colors.accentContrast, colors.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.accent, colors.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(colors.line, colors.background)).toBeGreaterThanOrEqual(3);
    });

    it('points every decoration at one of its own images', () => {
      for (const decorations of Object.values(theme.decorations)) {
        for (const decoration of decorations ?? []) {
          expect(theme.images).toHaveProperty([decoration.image]);
        }
      }
    });

    it('serves its artwork from its own folder under /public', () => {
      const images = [theme.hero, ...Object.values(theme.images)];
      if (theme.texture) images.push(theme.texture);
      for (const image of images) {
        expect(image.src).toMatch(new RegExp(`^/themes/${theme.id}/[a-z0-9-]+\\.webp$`));
        expect(image.width).toBeGreaterThan(0);
        expect(image.height).toBeGreaterThan(0);
      }
    });
  },
);

describe('theme registry', () => {
  it('falls back to the default theme for unknown or missing IDs', () => {
    expect(getTheme('praia-rosa').id).toBe('praia-rosa');
    expect(getTheme('does-not-exist').id).toBe(DEFAULT_THEME_ID);
    expect(getTheme(null).id).toBe(DEFAULT_THEME_ID);
    expect(getTheme(undefined).id).toBe(DEFAULT_THEME_ID);
    // Object prototype keys are not themes.
    expect(isThemeId('toString')).toBe(false);
    expect(getTheme('__proto__').id).toBe(DEFAULT_THEME_ID);
  });

  it('uses the default decorations for areas without their own', () => {
    const theme = getTheme('praia-rosa');
    expect(decorationsFor(theme, 'message')).toBe(theme.decorations.message);
    expect(decorationsFor(theme, 'rsvp')).toBe(theme.decorations.default);
  });
});

describe('themeCssVariables', () => {
  const theme = getTheme('praia-rosa');

  it('exposes colours, fonts and the texture as CSS variables', () => {
    expect(themeCssVariables(theme)).toMatchObject({
      '--theme-background': theme.colors.background,
      '--theme-ink': theme.colors.ink,
      '--theme-accent': theme.colors.accent,
      '--theme-accent-contrast': theme.colors.accentContrast,
      '--theme-font-script': theme.fonts.script,
      '--theme-texture': 'url("/themes/praia-rosa/background.webp")',
    });
  });

  it("applies the couple's colour overrides on top of the theme", () => {
    expect(themeCssVariables(theme, { colors: { accent: '#123456' } })).toMatchObject({
      '--theme-accent': '#123456',
      '--theme-ink': theme.colors.ink,
    });
  });

  it('sets no texture when the theme has none', () => {
    const { texture: _texture, ...plain } = theme;
    expect(themeCssVariables(plain)).toMatchObject({ '--theme-texture': 'none' });
  });
});
