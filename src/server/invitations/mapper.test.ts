import { describe, expect, it } from 'vitest';

import {
  safeHttpUrl,
  toInvitationEvent,
  type InvitationEventRow,
} from '@/server/invitations/mapper';

function row(overrides: Partial<InvitationEventRow> = {}): InvitationEventRow {
  return {
    id: 'event-1',
    slug: 'braulio-e-nanda',
    isActive: true,
    phase: 'INVITATION',
    themeId: 'praia-rosa',
    themeOverrides: null,
    monogram: null,
    groomName: 'Braúlio',
    brideName: 'Nanda',
    groomParents: ['Augusto Santos', ' ', 'Celeste Santos', 'Extra'],
    brideParents: [],
    startsAt: new Date('2027-01-15T15:00:00Z'),
    endsAt: null,
    introLine: null,
    invitationLine: '  ',
    celebrationLine: 'Para celebrar connosco.',
    infoBoxText: null,
    coupleMessage: '  O amor…  ',
    dressCodeText: null,
    dressCodeColors: ['#A8C5D6', 'red', '#123', '#E7B7C3;background:url(x)'],
    giftText: null,
    giftIban: 'AO06 0000',
    giftAccountHolder: null,
    rsvpMode: 'WHATSAPP',
    rsvpDeadline: new Date('2026-12-31T22:59:00Z'),
    groomWhatsapp: '+244900000001',
    brideWhatsapp: '923 456 789',
    sectionConfig: 'not a list',
    updatedAt: new Date('2026-09-24T10:00:00Z'),
    locations: [
      {
        heading: 'As cerimónias',
        venueName: 'Praia do Bispo',
        description: null,
        startsAt: new Date('2027-01-15T15:00:00Z'),
        address: null,
        mapsUrl: 'javascript:alert(1)',
        latitude: -8.829,
        longitude: 13.225,
      },
    ],
    timelineItems: [{ label: 'Corte do bolo', startsAt: null, icon: 'cake' }],
    guestRules: [{ text: 'Seja pontual!', icon: 'clock' }],
    media: [
      {
        type: 'GALLERY',
        originalKey: 'demo/gallery/foto-1.webp',
        variants: null,
        mimeType: 'image/webp',
        width: 1200,
        height: 1500,
        altText: null,
      },
      {
        type: 'GALLERY',
        originalKey: 'uploads/event-1/original.jpg',
        variants: { lg: { key: 'demo/gallery/foto-2.webp', width: 1600, height: 2000 } },
        mimeType: 'image/jpeg',
        width: 4000,
        height: 5000,
        altText: 'Na praia',
      },
      {
        // Stored in object storage: no public URL until Phase 7, so it is skipped.
        type: 'HERO',
        originalKey: 'uploads/event-1/hero.webp',
        variants: null,
        mimeType: 'image/webp',
        width: 1080,
        height: 900,
        altText: null,
      },
      {
        type: 'MUSIC',
        originalKey: 'demo/musica.wav',
        variants: null,
        mimeType: 'audio/wav',
        width: null,
        height: null,
        altText: null,
      },
    ],
    ...overrides,
  };
}

describe('invitation read model', () => {
  const event = toInvitationEvent(row());

  it('applies the default texts where the couple kept them', () => {
    expect(event.texts).toEqual({
      introLine: 'Com a benção de Deus',
      invitationLine: 'Têm a honra de convidar',
      celebrationLine: 'Para celebrar connosco.',
      infoBoxText: 'Convite válido para {seats}',
    });
    expect(event.coupleMessage).toBe('O amor…');
    expect(event.gifts.text).toBeNull();
  });

  it('derives the monogram from the names when none is set', () => {
    expect(event.monogram).toBe('BN');
    expect(toInvitationEvent(row({ monogram: 'N&B' })).monogram).toBe('N&B');
  });

  it('keeps at most two parents per side, without blanks', () => {
    expect(event.groomParents).toEqual(['Augusto Santos', 'Celeste Santos']);
    expect(event.brideParents).toEqual([]);
  });

  it('drops values that could inject into the page', () => {
    expect(event.dressCode.colors).toEqual(['#A8C5D6']);
    expect(event.locations[0]?.mapsUrl).toBeNull();
    expect(safeHttpUrl('https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
    expect(safeHttpUrl('data:text/html,hi')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });

  it('keeps only valid E.164 WhatsApp numbers', () => {
    expect(event.rsvp).toMatchObject({
      mode: 'WHATSAPP',
      groomWhatsapp: '+244900000001',
      brideWhatsapp: null,
      deadline: '2026-12-31T22:59:00.000Z',
    });
  });

  it('falls back to the default sections when the stored config is invalid', () => {
    expect(event.sections.map((section) => section.id)).toContain('invitation');
    expect(event.sections.find((section) => section.id === 'gifts')?.visible).toBe(false);
  });

  it('turns ready media into URLs, preferring the largest processed size', () => {
    expect(event.gallery).toEqual([
      { src: '/demo/gallery/foto-1.webp', width: 1200, height: 1500, alt: null },
      { src: '/demo/gallery/foto-2.webp', width: 1600, height: 2000, alt: 'Na praia' },
    ]);
    expect(event.hero).toBeNull();
    expect(event.music).toEqual({ src: '/demo/musica.wav', mimeType: 'audio/wav' });
  });

  it('is JSON-safe (Phase 5 caches it in Redis)', () => {
    expect(JSON.parse(JSON.stringify(event))).toEqual(event);
    expect(event.startsAt).toBe('2027-01-15T15:00:00.000Z');
  });
});
