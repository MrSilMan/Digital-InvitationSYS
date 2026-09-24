import { describe, expect, it } from 'vitest';

import { parseThemeOverrides, themeOverridesSchema } from '@/themes/overrides';

describe('theme overrides', () => {
  it('accepts partial #RRGGBB colour overrides', () => {
    expect(parseThemeOverrides({ colors: { accent: '#AABBCC' } })).toEqual({
      colors: { accent: '#AABBCC' },
    });
    expect(parseThemeOverrides({ colors: {} })).toEqual({ colors: {} });
    expect(parseThemeOverrides({})).toEqual({});
  });

  it.each([
    ['a colour name', { colors: { accent: 'red' } }],
    ['a short hex colour', { colors: { accent: '#abc' } }],
    ['CSS injection', { colors: { ink: '#000000; background: url(https://evil.test)' } }],
    ['an unknown colour', { colors: { shadow: '#000000' } }],
    ['an unknown setting', { fonts: { script: 'Comic Sans MS' } }],
    ['a non-object', 'accent'],
  ])('ignores %s entirely', (_case, value) => {
    expect(themeOverridesSchema.safeParse(value).success).toBe(false);
    expect(parseThemeOverrides(value)).toEqual({});
  });

  it('treats missing data as no overrides', () => {
    expect(parseThemeOverrides(null)).toEqual({});
    expect(parseThemeOverrides(undefined)).toEqual({});
  });
});
