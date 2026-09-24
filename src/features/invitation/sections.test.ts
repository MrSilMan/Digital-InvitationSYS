import { describe, expect, it } from 'vitest';

import { sectionsToShow } from '@/features/invitation/sections';
import { invitationEventFixture } from '@/features/invitation/test-fixtures';
import { SECTION_IDS } from '@/lib/validation/sections';

describe('sections a guest sees', () => {
  it("follow the couple's order and visibility", () => {
    const event = invitationEventFixture({
      sections: [
        { id: 'message', visible: true },
        { id: 'invitation', visible: true },
        { id: 'gallery', visible: false },
        ...SECTION_IDS.filter((id) => !['message', 'invitation', 'gallery'].includes(id)).map(
          (id) => ({ id, visible: true }),
        ),
      ],
    });
    const shown = sectionsToShow(event);
    expect(shown.slice(0, 2)).toEqual(['message', 'invitation']);
    expect(shown).not.toContain('gallery');
  });

  it('skip optional sections that have nothing to show', () => {
    const event = invitationEventFixture({
      coupleMessage: null,
      gallery: [],
      locations: [],
      timeline: [],
      dressCode: { text: null, colors: [] },
      rules: [],
      gifts: { text: null, iban: null, accountHolder: null },
    });
    expect(sectionsToShow(event)).toEqual(['invitation', 'countdown', 'rsvp', 'closing']);
  });

  it('show the RSVP section only when there is a way to confirm (the form arrives in Phase 5)', () => {
    const noNumbers = {
      mode: 'WHATSAPP',
      deadline: null,
      groomWhatsapp: null,
      brideWhatsapp: null,
    } as const;
    expect(sectionsToShow(invitationEventFixture({ rsvp: noNumbers }))).not.toContain('rsvp');
    const formOnly = { ...invitationEventFixture().rsvp, mode: 'FORM' } as const;
    expect(sectionsToShow(invitationEventFixture({ rsvp: formOnly }))).not.toContain('rsvp');
    const brideOnly = { ...noNumbers, brideWhatsapp: '+244900000002' };
    expect(sectionsToShow(invitationEventFixture({ rsvp: brideOnly }))).toContain('rsvp');
  });
});
