import { z } from 'zod';

/**
 * Invitation sections: their default order and visibility, and the shape stored in
 * `Event.sectionConfig`. The opening screen and the Save the Date page are not sections:
 * they depend on the event phase.
 */

export const SECTION_IDS = [
  'invitation',
  'countdown',
  'message',
  'gallery',
  'schedule',
  'dressCode',
  'guestManual',
  'gifts',
  'rsvp',
  'closing',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export interface SectionSetting {
  id: SectionId;
  visible: boolean;
}

/** Optional sections start hidden until the couple fills them in. */
const HIDDEN_BY_DEFAULT: readonly SectionId[] = ['dressCode', 'gifts'];

export const DEFAULT_SECTION_CONFIG: readonly SectionSetting[] = SECTION_IDS.map((id) => ({
  id,
  visible: !HIDDEN_BY_DEFAULT.includes(id),
}));

const sectionSettingSchema = z.object({
  id: z.enum(SECTION_IDS),
  visible: z.boolean(),
});

/**
 * Validates a stored or submitted configuration. Duplicates are rejected; sections missing from
 * the list (e.g. added in a later release) are appended with their default visibility.
 */
export const sectionConfigSchema = z
  .array(sectionSettingSchema)
  .max(SECTION_IDS.length)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, {
    message: 'Each section can appear only once',
  })
  .transform((items): SectionSetting[] => [
    ...items,
    ...DEFAULT_SECTION_CONFIG.filter((section) => !items.some((item) => item.id === section.id)),
  ]);

/** Reads `Event.sectionConfig` from the database; falls back to the defaults if it is invalid. */
export function parseSectionConfig(value: unknown): SectionSetting[] {
  const result = sectionConfigSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_SECTION_CONFIG.map((section) => ({ ...section }));
}
