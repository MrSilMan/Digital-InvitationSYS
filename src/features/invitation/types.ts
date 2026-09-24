import type { SectionSetting } from '@/lib/validation/sections';
import type { ThemeOverrides } from '@/themes/overrides';

/**
 * What a guest page receives: one event and one guest, nothing else (never other guests, phone
 * numbers of guests, or the owner's account). JSON-safe (dates as ISO strings), so Phase 5 can
 * cache it in Redis as is.
 */
export interface Invitation {
  event: InvitationEvent;
  guest: InvitationGuest;
}

export interface InvitationGuest {
  /** e.g. "Família Silva" */
  displayName: string;
  seatsAllowed: number;
}

export type InvitationPhase = 'SAVE_THE_DATE' | 'INVITATION';
export type InvitationRsvpMode = 'WHATSAPP' | 'FORM' | 'BOTH';

export interface InvitationImage {
  src: string;
  width: number;
  height: number;
  alt: string | null;
}

export interface InvitationAudio {
  src: string;
  mimeType: string;
}

export interface InvitationLocation {
  heading: string;
  venueName: string;
  /** Sentence with {venue} and {time}; null = the default sentence. */
  description: string | null;
  startsAt: string;
  address: string | null;
  /** Always an http(s) URL, or null. */
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface InvitationTimelineItem {
  label: string;
  startsAt: string | null;
  icon: string;
}

export interface InvitationRule {
  text: string;
  icon: string;
}

export interface InvitationEvent {
  id: string;
  slug: string;
  isActive: boolean;
  phase: InvitationPhase;
  themeId: string;
  themeOverrides: ThemeOverrides;
  /** Initials for the monogram (falls back to the couple's first letters). */
  monogram: string;
  /** Uploaded logo that replaces the monogram. */
  logo: InvitationImage | null;
  groomName: string;
  brideName: string;
  groomParents: string[];
  brideParents: string[];
  startsAt: string;
  endsAt: string | null;
  /** Editable lines, with the pt-AO defaults already applied. */
  texts: {
    introLine: string;
    invitationLine: string;
    celebrationLine: string;
    /** Contains {seats}. */
    infoBoxText: string;
  };
  coupleMessage: string | null;
  dressCode: { text: string | null; colors: string[] };
  gifts: { text: string | null; iban: string | null; accountHolder: string | null };
  rsvp: {
    mode: InvitationRsvpMode;
    deadline: string | null;
    groomWhatsapp: string | null;
    brideWhatsapp: string | null;
  };
  sections: SectionSetting[];
  locations: InvitationLocation[];
  timeline: InvitationTimelineItem[];
  rules: InvitationRule[];
  /** Uploaded hero illustration; null = the theme's. */
  hero: InvitationImage | null;
  gallery: InvitationImage[];
  music: InvitationAudio | null;
  updatedAt: string;
}
