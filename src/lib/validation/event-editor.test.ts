import { describe, expect, it } from 'vitest';

import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';
import { DEFAULT_SECTION_CONFIG } from '@/lib/validation/sections';

import {
  type EventEditorValues,
  eventEditorSchema,
  parseEditorDraft,
  toEditorTemplate,
  toStoredTemplate,
} from './event-editor';

type RuleIcon = EventEditorValues['rules'][number]['icon'];

/** The demo wedding as the editor form holds it. */
function values(overrides: Partial<EventEditorValues> = {}): EventEditorValues {
  return {
    phase: 'INVITATION',
    themeId: 'praia-rosa',
    colors: { background: '', ink: '', script: '', accent: '' },
    sections: DEFAULT_SECTION_CONFIG.map((section) => ({ ...section })),
    groomName: 'Braúlio',
    brideName: 'Nanda',
    groomParents: ['Augusto Santos', 'Celeste Santos'],
    brideParents: ['Domingos Cassoma', ''],
    monogram: 'bn',
    introLine: '',
    invitationLine: '',
    celebrationLine: '',
    infoBoxText: 'Convite válido para {pessoas}',
    date: '2027-01-15',
    startTime: '16:00',
    endTime: '01:00',
    venues: [
      {
        heading: 'As cerimónias',
        venueName: 'Praia do Bispo',
        time: '16:00',
        description: '',
        address: 'Luanda',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.829,13.225',
        latitude: '-8.829',
        longitude: '13.225',
      },
    ],
    timeline: [
      { label: 'Chegada dos convidados', time: '15:30', icon: 'guests' },
      { label: 'Entrega do bouquet', time: '00:30', icon: 'bouquet' },
      { label: 'Surpresa', time: '', icon: 'heart' },
    ],
    coupleMessage: '  Linha 1\r\nLinha 2  ',
    dressCodeText: '',
    dressCodeColors: ['#A8C5D6'],
    rules: DEFAULT_GUEST_RULES.map((rule) => ({ text: rule.text, icon: rule.icon as RuleIcon })),
    giftText: '',
    giftIban: 'ao33000000000000000000000',
    giftAccountHolder: '',
    rsvpMode: 'BOTH',
    groomWhatsapp: '923 456 789',
    brideWhatsapp: '',
    rsvpDeadline: '2026-12-31',
    ...overrides,
  };
}

function issuePaths(input: EventEditorValues): string[] {
  const result = eventEditorSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('eventEditorSchema', () => {
  it('turns the form into database values', () => {
    const data = eventEditorSchema.parse(values());
    expect(data).toMatchObject({
      monogram: 'BN',
      groomParents: ['Augusto Santos', 'Celeste Santos'],
      brideParents: ['Domingos Cassoma'],
      introLine: null,
      infoBoxText: 'Convite válido para {seats}',
      themeOverrides: null,
      coupleMessage: 'Linha 1\nLinha 2',
      dressCodeColors: ['#a8c5d6'],
      giftIban: 'AO33 0000 0000 0000 0000 0000 0',
      groomWhatsapp: '+244923456789',
      brideWhatsapp: null,
    });
    expect(data.startsAt.toISOString()).toBe('2027-01-15T15:00:00.000Z');
    // 01:00 and 00:30 are the night after the wedding day.
    expect(data.endsAt?.toISOString()).toBe('2027-01-16T00:00:00.000Z');
    expect(data.timelineItems.map((item) => item.startsAt?.toISOString() ?? null)).toEqual([
      '2027-01-15T14:30:00.000Z',
      '2027-01-15T23:30:00.000Z',
      null,
    ]);
    expect(data.locations[0]).toMatchObject({ latitude: -8.829, longitude: 13.225 });
    expect(data.rsvpDeadline?.toISOString()).toBe('2026-12-31T22:59:00.000Z');
  });

  it('keeps colour overrides and always shows the invitation card', () => {
    const sections = DEFAULT_SECTION_CONFIG.map((section) => ({ ...section, visible: false }));
    const data = eventEditorSchema.parse(
      values({ colors: { background: '', ink: '#112233', script: '', accent: '' }, sections }),
    );
    expect(data.themeOverrides).toEqual({ colors: { ink: '#112233' } });
    expect(data.sectionConfig.find((section) => section.id === 'invitation')?.visible).toBe(true);
  });

  it('reports every invalid field', () => {
    expect(
      issuePaths(
        values({
          groomName: ' ',
          date: '2027-02-30',
          giftIban: 'AO33 0000',
          groomWhatsapp: '12345',
          colors: { background: 'red', ink: '', script: '', accent: '' },
          monogram: 'B1',
        }),
      ).sort(),
    ).toEqual(['colors.background', 'date', 'giftIban', 'groomName', 'groomWhatsapp', 'monogram']);
  });

  it('checks list items and limits', () => {
    const venue = values().venues[0]!;
    expect(issuePaths(values({ venues: [{ ...venue, venueName: '' }] }))).toEqual([
      'venues.0.venueName',
    ]);
    expect(issuePaths(values({ venues: [{ ...venue, latitude: '', longitude: '13.2' }] }))).toEqual(
      ['venues.0.longitude'],
    );
    expect(issuePaths(values({ venues: [{ ...venue, mapsUrl: 'javascript:alert(1)' }] }))).toEqual([
      'venues.0.mapsUrl',
    ]);
    expect(issuePaths(values({ venues: Array.from({ length: 5 }, () => venue) }))).toEqual([
      'venues',
    ]);
  });

  it('checks the rules between fields', () => {
    expect(
      issuePaths(values({ rsvpMode: 'WHATSAPP', groomWhatsapp: '', brideWhatsapp: '' })),
    ).toEqual(['groomWhatsapp']);
    expect(issuePaths(values({ rsvpMode: 'FORM', groomWhatsapp: '', brideWhatsapp: '' }))).toEqual(
      [],
    );
    expect(issuePaths(values({ rsvpDeadline: '2027-01-16' }))).toEqual(['rsvpDeadline']);
    expect(issuePaths(values({ endTime: '15:00' }))).toEqual(['endTime']);
  });
});

describe('placeholders', () => {
  it('shows Portuguese placeholders and stores the ones the invitation fills in', () => {
    expect(toStoredTemplate('Válido para {pessoas}, no {local} às {hora}.')).toBe(
      'Válido para {seats}, no {venue} às {time}.',
    );
    expect(toEditorTemplate('Válido para {seats}, no {venue} às {time}.')).toBe(
      'Válido para {pessoas}, no {local} às {hora}.',
    );
  });
});

describe('parseEditorDraft (live preview)', () => {
  const saved = values();

  it('uses valid unsaved values and keeps the saved ones for anything invalid', () => {
    const draft = {
      ...values(),
      coupleMessage: 'Nova mensagem',
      groomName: '',
      startTime: '16:3',
      venues: [
        ...saved.venues,
        { ...saved.venues[0]!, venueName: '' },
        { ...saved.venues[0]!, venueName: 'Salão Novo', time: '20:00' },
      ],
    };
    const data = parseEditorDraft(draft, saved);
    expect(data?.coupleMessage).toBe('Nova mensagem');
    expect(data?.groomName).toBe('Braúlio');
    expect(data?.startsAt.toISOString()).toBe('2027-01-15T15:00:00.000Z');
    expect(data?.locations.map((location) => location.venueName)).toEqual([
      'Praia do Bispo',
      'Salão Novo',
    ]);
  });

  it('empties optional fields that were saved before they were validated', () => {
    const data = parseEditorDraft(values(), values({ giftIban: 'AO06 0000 0000' }));
    expect(data).not.toBeNull();
  });

  it('ignores what is not form values', () => {
    expect(parseEditorDraft(null, saved)).toBeNull();
    expect(parseEditorDraft(['x'], saved)).toBeNull();
    expect(parseEditorDraft({ coupleMessage: 42 }, saved)?.coupleMessage).toBe('Linha 1\nLinha 2');
  });
});
