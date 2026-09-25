import type { Prisma } from '@/generated/prisma/client';
import type {
  InvitationAudio,
  InvitationEvent,
  InvitationImage,
} from '@/features/invitation/types';
import { invitationDefaults } from '@/i18n/pt-AO';
import { parseSectionConfig } from '@/lib/validation/sections';
import { mediaUrl } from '@/server/media/urls';
import { audioFileKey, imageFiles } from '@/server/media/variants';
import { parseThemeOverrides } from '@/themes/overrides';

/** Everything a guest page shows about an event, and nothing more. */
export const invitationEventSelect = {
  id: true,
  slug: true,
  isActive: true,
  phase: true,
  themeId: true,
  themeOverrides: true,
  monogram: true,
  groomName: true,
  brideName: true,
  groomParents: true,
  brideParents: true,
  startsAt: true,
  endsAt: true,
  introLine: true,
  invitationLine: true,
  celebrationLine: true,
  infoBoxText: true,
  coupleMessage: true,
  dressCodeText: true,
  dressCodeColors: true,
  giftText: true,
  giftIban: true,
  giftAccountHolder: true,
  rsvpMode: true,
  rsvpDeadline: true,
  groomWhatsapp: true,
  brideWhatsapp: true,
  sectionConfig: true,
  updatedAt: true,
  locations: {
    orderBy: { position: 'asc' },
    select: {
      heading: true,
      venueName: true,
      description: true,
      startsAt: true,
      address: true,
      mapsUrl: true,
      latitude: true,
      longitude: true,
    },
  },
  timelineItems: {
    orderBy: { position: 'asc' },
    select: { label: true, startsAt: true, icon: true },
  },
  guestRules: { orderBy: { position: 'asc' }, select: { text: true, icon: true } },
  media: {
    where: { status: 'READY' },
    orderBy: { position: 'asc' },
    select: {
      type: true,
      originalKey: true,
      variants: true,
      mimeType: true,
      width: true,
      height: true,
      altText: true,
    },
  },
} satisfies Prisma.EventSelect;

export type InvitationEventRow = Prisma.EventGetPayload<{ select: typeof invitationEventSelect }>;
type MediaRow = InvitationEventRow['media'][number];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const E164 = /^\+[1-9]\d{7,14}$/;

/** Only http(s) links reach an href (never `javascript:` or other schemes). */
export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Uploaded images point at their widest processed file and list the other widths (`MediaImage`
 * picks among them); demo media have no variants and point at their file in /public. Originals
 * are never served.
 */
function toImage(media: MediaRow): InvitationImage | null {
  const files = imageFiles(media.variants);
  const widest = files[files.length - 1];
  const key = widest?.key ?? media.originalKey;
  const width = widest?.width ?? media.width;
  const height = widest?.height ?? media.height;
  const src = mediaUrl(key);
  if (!src || !width || !height) return null;
  const image: InvitationImage = { src, width, height, alt: media.altText };
  if (widest) image.widths = files.map((file) => file.width);
  return image;
}

function toAudio(media: MediaRow): InvitationAudio | null {
  const processed = audioFileKey(media.variants);
  const src = mediaUrl(processed ?? media.originalKey);
  if (!src) return null;
  return { src, mimeType: processed ? 'audio/mpeg' : media.mimeType };
}

function firstLetter(name: string): string {
  return Array.from(name.trim())[0] ?? '';
}

const text = (value: string | null) => (value?.trim() ? value.trim() : null);

export function toInvitationEvent(row: InvitationEventRow): InvitationEvent {
  const images = (type: MediaRow['type']) =>
    row.media
      .filter((media) => media.type === type)
      .map(toImage)
      .filter((image) => image !== null);
  const music = row.media.find((media) => media.type === 'MUSIC');

  return {
    id: row.id,
    slug: row.slug,
    isActive: row.isActive,
    phase: row.phase,
    themeId: row.themeId,
    themeOverrides: parseThemeOverrides(row.themeOverrides),
    monogram: text(row.monogram) ?? `${firstLetter(row.groomName)}${firstLetter(row.brideName)}`,
    logo: images('LOGO')[0] ?? null,
    groomName: row.groomName,
    brideName: row.brideName,
    groomParents: row.groomParents.filter((name) => name.trim()).slice(0, 2),
    brideParents: row.brideParents.filter((name) => name.trim()).slice(0, 2),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    texts: {
      introLine: text(row.introLine) ?? invitationDefaults.introLine,
      invitationLine: text(row.invitationLine) ?? invitationDefaults.invitationLine,
      celebrationLine: text(row.celebrationLine) ?? invitationDefaults.celebrationLine,
      infoBoxText: text(row.infoBoxText) ?? invitationDefaults.infoBoxText,
    },
    coupleMessage: text(row.coupleMessage),
    dressCode: {
      text: text(row.dressCodeText),
      colors: row.dressCodeColors.filter((color) => HEX_COLOR.test(color)),
    },
    gifts: {
      text: text(row.giftText),
      iban: text(row.giftIban),
      accountHolder: text(row.giftAccountHolder),
    },
    rsvp: {
      mode: row.rsvpMode,
      deadline: row.rsvpDeadline?.toISOString() ?? null,
      groomWhatsapp: row.groomWhatsapp && E164.test(row.groomWhatsapp) ? row.groomWhatsapp : null,
      brideWhatsapp: row.brideWhatsapp && E164.test(row.brideWhatsapp) ? row.brideWhatsapp : null,
    },
    sections: parseSectionConfig(row.sectionConfig),
    locations: row.locations.map((location) => ({
      heading: location.heading,
      venueName: location.venueName,
      description: text(location.description),
      startsAt: location.startsAt.toISOString(),
      address: text(location.address),
      mapsUrl: safeHttpUrl(location.mapsUrl),
      latitude: location.latitude,
      longitude: location.longitude,
    })),
    timeline: row.timelineItems.map((item) => ({
      label: item.label,
      startsAt: item.startsAt?.toISOString() ?? null,
      icon: item.icon,
    })),
    rules: row.guestRules.map((rule) => ({ text: rule.text, icon: rule.icon })),
    hero: images('HERO')[0] ?? null,
    gallery: images('GALLERY').slice(0, 12),
    music: music ? toAudio(music) : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
