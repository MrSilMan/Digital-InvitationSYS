/**
 * Keys of the invitation icon set (components in ./index.tsx). They are stored in the database
 * (timeline items, guest rules): never rename or remove one without a data migration.
 * Plain data, so validation schemas can use it without importing the icon components.
 */
export const ICON_KEYS = [
  'guests',
  'clock',
  'user-plus',
  'confetti',
  'wedding-dress',
  'camera-heart',
  'dance',
  'smile',
  'bride-groom',
  'buffet',
  'cake',
  'bouquet',
  'rings',
  'camera',
  'map-pin',
  'check-circle',
  'whatsapp',
  'waze',
  'calendar-plus',
  'copy',
  'gift',
  'hanger',
  'heart',
  'music',
  'volume',
  'volume-off',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

export function isIconKey(value: unknown): value is IconKey {
  return typeof value === 'string' && (ICON_KEYS as readonly string[]).includes(value);
}

/** Icons couples can pick for timeline items and guest rules (the others belong to buttons). */
export const CONTENT_ICON_KEYS = [
  'guests',
  'bride-groom',
  'rings',
  'clock',
  'camera-heart',
  'camera',
  'buffet',
  'cake',
  'dance',
  'music',
  'bouquet',
  'wedding-dress',
  'confetti',
  'gift',
  'hanger',
  'heart',
  'smile',
  'user-plus',
  'map-pin',
  'check-circle',
] as const satisfies readonly IconKey[];

export type ContentIconKey = (typeof CONTENT_ICON_KEYS)[number];
