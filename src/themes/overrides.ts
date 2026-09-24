import { z } from 'zod';

/**
 * Per-event adjustments on top of the theme (`Event.themeOverrides`), chosen by the couple in the
 * dashboard (Phase 7). Only colours for now; unknown keys are rejected.
 */

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB colour');

export const themeOverridesSchema = z
  .object({
    colors: z
      .object({
        background: hexColor,
        ink: hexColor,
        script: hexColor,
        accent: hexColor,
      })
      .partial()
      .strict()
      .optional(),
  })
  .strict();

export type ThemeOverrides = z.infer<typeof themeOverridesSchema>;

/** Reads `Event.themeOverrides`; invalid or missing data means "no overrides". */
export function parseThemeOverrides(value: unknown): ThemeOverrides {
  if (value === null || value === undefined) return {};
  const result = themeOverridesSchema.safeParse(value);
  return result.success ? result.data : {};
}
