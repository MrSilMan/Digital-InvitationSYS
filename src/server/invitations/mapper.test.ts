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
        originalKey: 'originals/event-1/photo-2.jpg',
        variants: {
          w480: { key: 'media/event-1/photo-2/w480.webp', width: 480, height: 600 },
          w1600: { key: 'media/event-1/photo-2/w1600.webp', width: 1600, height: 2000 },
          w960: { key: 'media/event-1/photo-2/w960.webp', width: 960, height: 1200 },
        },
        mimeType: 'image/jpeg',
        width: 4000,
        height: 5000,
        altText: 'Na praia',
      },
      {
        // Not processed: originals are never served, so it is skipped.
        type: 'HERO',
        originalKey: 'originals/event-1/hero.png',
        variants: null,
        mimeType: 'image/png',
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

  it('turns ready media into URLs: the widest processed file, with the other widths', () => {
    expect(event.gallery).toEqual([
      { src: '/demo/gallery/foto-1.webp', width: 1200, height: 1500, alt: null },
      {
        src: '/m/event-1/photo-2/w1600.webp',
        width: 1600,
        height: 2000,
        alt: 'Na praia',
        widths: [480, 960, 1600],
      },
    ]);
    expect(event.hero).toBeNull();
    expect(event.music).toEqual({ src: '/demo/musica.wav', mimeType: 'audio/wav' });
  });

  it('plays the checked MP3 of uploaded music, never the original', () => {
    const music = {
      type: 'MUSIC' as const,
      originalKey: 'originals/event-1/song.mp3',
      mimeType: 'audio/mpeg',
      width: null,
      height: null,
      altText: null,
    };
    const processed = toInvitationEvent(
      row({
        media: [
          {
            ...music,
            variants: { audio: { key: 'media/event-1/song/musica.mp3', bytes: 4096 } },
          },
        ],
      }),
    );
    expect(processed.music).toEqual({ src: '/m/event-1/song/musica.mp3', mimeType: 'audio/mpeg' });
    expect(toInvitationEvent(row({ media: [{ ...music, variants: null }] })).music).toBeNull();
  });

  it('is JSON-safe (Phase 5 caches it in Redis)', () => {
    expect(JSON.parse(JSON.stringify(event))).toEqual(event);
    expect(event.startsAt).toBe('2027-01-15T15:00:00.000Z');
  });
});
