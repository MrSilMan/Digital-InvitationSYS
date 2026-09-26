import type { Invitation, InvitationEvent } from '@/features/invitation/types';
import { invitationDefaults, landing } from '@/i18n/pt-AO';
import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';
import { SECTION_IDS } from '@/lib/validation/sections';
import type { ThemeId } from '@/themes';

/**
 * The public theme demos (/demonstracao/<tema>) and the landing page's examples: the demo seed's
 * wedding (prisma/seed/demo-data.ts), built in memory (no database), with every section shown.
 * The date moves with the calendar, so the countdown always has something to count.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Luanda is UTC+1 all year. */
const LUANDA_OFFSET = HOUR;

/** How far ahead the demo wedding is. */
const DAYS_AHEAD = 120;

/**
 * A Saturday at 16h00 in Luanda, at least `DAYS_AHEAD` days after `now`. The same all day long
 * (it only depends on the Luanda calendar date), so pages rendered minutes apart agree.
 */
export function demoWeddingDate(now: Date): Date {
  // UTC fields of this shifted date are Luanda's wall-clock date.
  const luanda = new Date(now.getTime() + LUANDA_OFFSET + DAYS_AHEAD * DAY);
  const toSaturday = (6 - luanda.getUTCDay() + 7) % 7;
  const day = new Date(luanda.getTime() + toSaturday * DAY);
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 16) - LUANDA_OFFSET,
  );
}

/** Warm tones that suit each theme (ivory is left out: too close to the bride's white). */
const DRESS_CODE_COLORS: Record<ThemeId, string[]> = {
  'praia-rosa': ['#A8C5D6', '#E7B7C3', '#857D45', '#F3E9DC'],
  champanhe: ['#D8C3A5', '#B08D57', '#8A9A80', '#5E5247'],
};

export const DEMO_PARENTS = {
  groom: ['Augusto Santos', 'Celeste Santos'],
  bride: ['Domingos Cassoma', 'Fernanda Cassoma'],
} as const;

/** The demo's guest: the name on the envelope and the invitation card. */
export const DEMO_GUEST = {
  id: 'demonstracao',
  displayName: landing.hero.sampleGuest,
  seatsAllowed: 4,
} as const;

export function demoInvitationEvent(themeId: ThemeId, now: Date): InvitationEvent {
  const startsAt = demoWeddingDate(now);
  /** A time of the wedding day, e.g. at(20) = 20h00, at(23, 30) = 23h30. */
  const at = (hours: number, minutes = 0) =>
    new Date(startsAt.getTime() + (hours - 16) * HOUR + minutes * MINUTE).toISOString();
  const { groom, bride } = landing.sampleCouple;

  return {
    id: `demonstracao-${themeId}`,
    slug: `demonstracao-${themeId}`,
    isActive: true,
    phase: 'INVITATION',
    themeId,
    themeOverrides: {},
    monogram: `${groom[0] ?? ''}${bride[0] ?? ''}`,
    logo: null,
    groomName: groom,
    brideName: bride,
    groomParents: [...DEMO_PARENTS.groom],
    brideParents: [...DEMO_PARENTS.bride],
    startsAt: startsAt.toISOString(),
    endsAt: at(25),
    texts: {
      introLine: invitationDefaults.introLine,
      invitationLine: invitationDefaults.invitationLine,
      celebrationLine: invitationDefaults.celebrationLine,
      infoBoxText: invitationDefaults.infoBoxText,
    },
    coupleMessage:
      'O amor é um presente de Deus,\ne Ele nos uniu para sempre.\n\n' +
      'Venha testemunhar esta promessa eterna e celebrar connosco o dia em que nos tornamos um só diante do Senhor.',
    dressCode: {
      text: 'Traje social. Pedimos que evitem o branco, a cor reservada à noiva.',
      colors: DRESS_CODE_COLORS[themeId],
    },
    gifts: {
      text: 'A vossa presença é o nosso maior presente. Se desejarem contribuir para a nossa nova etapa, deixamos o IBAN abaixo.',
      iban: 'AO33 0000 0000 0000 0000 0000 0',
      accountHolder: 'Braúlio Santos',
    },
    rsvp: {
      mode: 'BOTH',
      deadline: new Date(startsAt.getTime() - 14 * DAY).toISOString(),
      // The unassigned demo range; the demo's buttons are inert anyway.
      groomWhatsapp: '+244900000001',
      brideWhatsapp: '+244900000002',
    },
    sections: SECTION_IDS.map((id) => ({ id, visible: true })),
    locations: [
      {
        heading: 'As cerimónias',
        venueName: 'Praia do Bispo',
        description: null,
        startsAt: at(16),
        address: 'Praia do Bispo, Luanda',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.8290,13.2250',
        latitude: -8.829,
        longitude: 13.225,
      },
      {
        heading: "Copo-d'água",
        venueName: 'Salão de Festas Jardim das Rosas',
        description: 'Será realizado às {time}, no {venue}, Morro Bento.',
        startsAt: at(20),
        address: 'Morro Bento, Luanda',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.8960,13.1900',
        latitude: -8.896,
        longitude: 13.19,
      },
    ],
    timeline: [
      { label: 'Chegada dos convidados', startsAt: at(15, 30), icon: 'guests' },
      { label: 'Chegada dos noivos', startsAt: at(16), icon: 'bride-groom' },
      { label: 'Sessão de fotos', startsAt: at(17), icon: 'camera-heart' },
      { label: 'Abertura do buffet', startsAt: at(20), icon: 'buffet' },
      { label: 'Corte do bolo', startsAt: at(21, 30), icon: 'cake' },
      { label: 'Abertura da pista', startsAt: at(22), icon: 'dance' },
      { label: 'Entrega do bouquet', startsAt: at(23, 30), icon: 'bouquet' },
    ],
    rules: DEFAULT_GUEST_RULES.map((rule) => ({ ...rule })),
    hero: null,
    // Placeholder media shipped in public/demo (npm run demo:media).
    gallery: Array.from({ length: 6 }, (_, index) => ({
      src: `/demo/gallery/foto-${index + 1}.webp`,
      width: 1200,
      height: 1500,
      alt: null,
    })),
    music: { src: '/demo/musica.wav', mimeType: 'audio/wav' },
    updatedAt: now.toISOString(),
  };
}

export function demoInvitation(themeId: ThemeId, now: Date): Invitation {
  return { event: demoInvitationEvent(themeId, now), guest: { ...DEMO_GUEST } };
}
