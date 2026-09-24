import {
  IconBrandWaze,
  IconBrandWhatsapp,
  IconCake,
  IconCalendarPlus,
  IconCamera,
  IconCameraHeart,
  IconCircleCheckFilled,
  IconClock,
  IconConfetti,
  IconCopy,
  IconGift,
  IconGlassChampagne,
  IconHanger,
  IconHeart,
  IconMapPinFilled,
  IconMoodSmile,
  IconMusic,
  IconUserPlus,
  IconUsersGroup,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react';

import {
  BouquetIcon,
  BrideGroomIcon,
  DancingCoupleIcon,
  WeddingDressIcon,
  WeddingRingsIcon,
} from './custom';
import { type IconKey, isIconKey } from './keys';

/**
 * The invitation icon set, by key. Keys are stored in the database (timeline items, guest rules),
 * so never rename one without a data migration. Tabler first; custom line icons where Tabler has
 * none. Both render as plain SVG on the server (no client JavaScript).
 */
export const ICONS = {
  guests: IconUsersGroup,
  clock: IconClock,
  'user-plus': IconUserPlus,
  confetti: IconConfetti,
  'wedding-dress': WeddingDressIcon,
  'camera-heart': IconCameraHeart,
  dance: DancingCoupleIcon,
  smile: IconMoodSmile,
  'bride-groom': BrideGroomIcon,
  buffet: IconGlassChampagne,
  cake: IconCake,
  bouquet: BouquetIcon,
  rings: WeddingRingsIcon,
  camera: IconCamera,
  'map-pin': IconMapPinFilled,
  'check-circle': IconCircleCheckFilled,
  whatsapp: IconBrandWhatsapp,
  waze: IconBrandWaze,
  'calendar-plus': IconCalendarPlus,
  copy: IconCopy,
  gift: IconGift,
  hanger: IconHanger,
  heart: IconHeart,
  music: IconMusic,
  volume: IconVolume,
  'volume-off': IconVolumeOff,
} as const satisfies Record<IconKey, unknown>;

export { ICON_KEYS, isIconKey, type IconKey } from './keys';

export interface IconProps {
  /** Icon key; unknown keys (e.g. from old data) fall back to a heart. */
  name: string;
  size?: number | string;
  stroke?: number;
  className?: string;
  /** Accessible name. Without it the icon is decorative (hidden from screen readers). */
  title?: string;
}

export function Icon({ name, size = 24, stroke = 1.5, className, title }: IconProps) {
  const Component = ICONS[isIconKey(name) ? name : 'heart'];
  return (
    <Component
      size={size}
      stroke={stroke}
      className={className}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    />
  );
}
