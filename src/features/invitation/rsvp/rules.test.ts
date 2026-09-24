import { describe, expect, it } from 'vitest';

import {
  acceptsForm,
  acceptsWhatsapp,
  canConfirm,
  rsvpClosed,
} from '@/features/invitation/rsvp/rules';
import type { InvitationEvent } from '@/features/invitation/types';

type Rsvp = InvitationEvent['rsvp'];
const event = (rsvp: Partial<Rsvp>) => ({
  rsvp: {
    mode: 'BOTH',
    deadline: '2026-12-31T22:59:00.000Z',
    groomWhatsapp: '+244900000001',
    brideWhatsapp: null,
    ...rsvp,
  } satisfies Rsvp,
});

describe('RSVP rules', () => {
  it.each([
    ['FORM', true, false],
    ['WHATSAPP', false, true],
    ['BOTH', true, true],
  ] as const)('%s mode: form %s, WhatsApp %s', (mode, form, whatsapp) => {
    expect(acceptsForm(event({ mode }))).toBe(form);
    expect(acceptsWhatsapp(event({ mode }))).toBe(whatsapp);
  });

  it('needs at least one number for WhatsApp', () => {
    const noNumbers = event({ mode: 'WHATSAPP', groomWhatsapp: null, brideWhatsapp: null });
    expect(acceptsWhatsapp(noNumbers)).toBe(false);
    expect(canConfirm(noNumbers)).toBe(false);
    expect(canConfirm(event({ mode: 'FORM', groomWhatsapp: null }))).toBe(true);
  });

  it('accepts answers until the deadline, inclusive', () => {
    const deadline = Date.parse('2026-12-31T22:59:00.000Z');
    expect(rsvpClosed(event({}), new Date(deadline - 1))).toBe(false);
    expect(rsvpClosed(event({}), new Date(deadline))).toBe(false);
    expect(rsvpClosed(event({}), new Date(deadline + 1))).toBe(true);
    expect(rsvpClosed(event({ deadline: null }), new Date('2099-01-01'))).toBe(false);
  });
});
