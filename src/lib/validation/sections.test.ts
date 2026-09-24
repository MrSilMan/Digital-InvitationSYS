import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SECTION_CONFIG,
  parseSectionConfig,
  SECTION_IDS,
  sectionConfigSchema,
} from '@/lib/validation/sections';

describe('section configuration', () => {
  it('lists every section once, optional ones hidden by default', () => {
    expect(DEFAULT_SECTION_CONFIG.map((section) => section.id)).toEqual([...SECTION_IDS]);
    const hidden = DEFAULT_SECTION_CONFIG.filter((section) => !section.visible).map((s) => s.id);
    expect(hidden).toEqual(['dressCode', 'gifts']);
  });

  it('keeps the couple’s order and visibility, appending sections they never saw', () => {
    const result = sectionConfigSchema.parse([
      { id: 'rsvp', visible: true },
      { id: 'invitation', visible: true },
      { id: 'gallery', visible: false },
    ]);

    expect(result.slice(0, 3)).toEqual([
      { id: 'rsvp', visible: true },
      { id: 'invitation', visible: true },
      { id: 'gallery', visible: false },
    ]);
    expect(result).toHaveLength(SECTION_IDS.length);
    expect(result.find((section) => section.id === 'dressCode')?.visible).toBe(false);
  });

  it('rejects duplicates and unknown sections', () => {
    expect(
      sectionConfigSchema.safeParse([
        { id: 'rsvp', visible: true },
        { id: 'rsvp', visible: false },
      ]).success,
    ).toBe(false);
    expect(sectionConfigSchema.safeParse([{ id: 'karaoke', visible: true }]).success).toBe(false);
  });

  it('turns the database default ([]) into the default configuration', () => {
    expect(parseSectionConfig([])).toEqual(DEFAULT_SECTION_CONFIG);
  });

  it('falls back to the defaults when stored data is invalid', () => {
    expect(parseSectionConfig({ not: 'an array' })).toEqual(DEFAULT_SECTION_CONFIG);
    expect(parseSectionConfig(null)).toEqual(DEFAULT_SECTION_CONFIG);
  });
});
