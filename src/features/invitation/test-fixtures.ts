import { DEFAULT_SECTION_CONFIG } from '@/lib/validation/sections';

import type { InvitationEvent, InvitationGuest } from './types';

/** A complete invitation for tests (mirrors the demo seed). */
export function invitationEventFixture(overrides: Partial<InvitationEvent> = {}): InvitationEvent {
  return {
    id: '01a0d063-3d86-74bf-8af9-dda9692a9f9d',
    slug: 'braulio-e-nanda',
    isActive: true,
    phase: 'INVITATION',
    themeId: 'praia-rosa',
    themeOverrides: {},
    monogram: 'BN',
    logo: null,
    groomName: 'Braúlio',
    brideName: 'Nanda',
    groomParents: ['Augusto Santos', 'Celeste Santos'],
    brideParents: ['Domingos Cassoma', 'Fernanda Cassoma'],
    startsAt: '2027-01-15T15:00:00.000Z',
    endsAt: '2027-01-16T00:00:00.000Z',
    texts: {
      introLine: 'Com a benção de Deus',
      invitationLine: 'Têm a honra de convidar',
      celebrationLine: 'para celebrar a cerimónia de casamento dos seus filhos.',
      infoBoxText: 'Convite válido para {seats}',
    },
    coupleMessage: 'O amor é um presente de Deus.',
    dressCode: { text: 'Traje social.', colors: ['#A8C5D6'] },
    gifts: {
      text: 'A vossa presença é o nosso maior presente.',
      iban: 'AO06 0000 0000 0000 0000 0000 0',
      accountHolder: 'Braúlio Santos',
    },
    rsvp: {
      mode: 'BOTH',
      deadline: '2026-12-31T22:59:00.000Z',
      groomWhatsapp: '+244900000001',
      brideWhatsapp: '+244900000002',
    },
    sections: DEFAULT_SECTION_CONFIG.map((section) => ({ ...section, visible: true })),
    locations: [
      {
        heading: 'As cerimónias',
        venueName: 'Praia do Bispo',
        description: null,
        startsAt: '2027-01-15T15:00:00.000Z',
        address: 'Praia do Bispo, Luanda',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.8290,13.2250',
        latitude: -8.829,
        longitude: 13.225,
      },
      {
        heading: "Copo-d'água",
        venueName: 'Salão de Festas Jardim das Rosas',
        description: 'Será realizado às {time}, no {venue}, Morro Bento.',
        startsAt: '2027-01-15T19:00:00.000Z',
        address: 'Morro Bento, Luanda',
        mapsUrl: null,
        latitude: null,
        longitude: null,
      },
    ],
    timeline: [
      { label: 'Chegada dos convidados', startsAt: '2027-01-15T14:30:00.000Z', icon: 'guests' },
      { label: 'Corte do bolo', startsAt: null, icon: 'cake' },
    ],
    rules: [{ text: 'Seja pontual!', icon: 'clock' }],
    hero: null,
    gallery: [
      { src: '/demo/gallery/foto-1.webp', width: 1200, height: 1500, alt: null },
      { src: '/demo/gallery/foto-2.webp', width: 1200, height: 1500, alt: 'Na praia' },
    ],
    music: { src: '/demo/musica.wav', mimeType: 'audio/wav' },
    updatedAt: '2026-09-24T10:00:00.000Z',
    ...overrides,
  };
}

export const guestFixture: InvitationGuest = { displayName: 'Família Silva', seatsAllowed: 4 };
