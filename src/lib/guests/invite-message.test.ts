import { describe, expect, it } from 'vitest';

import { whatsappUrl } from '@/features/invitation/links';
import {
  buildInviteMessage,
  defaultInviteMessage,
  type InviteContext,
} from '@/lib/guests/invite-message';

const context: InviteContext = {
  phase: 'INVITATION',
  template: null,
  couple: 'Braúlio e Nanda',
  date: '15 de janeiro de 2027',
};
const guest = {
  displayName: 'Família Silva',
  link: 'https://convites.ao/c/braulio-e-nanda/Abc123Abc123Abc123Abc1',
};

describe('invite message', () => {
  it('fills the suggested text for the phase', () => {
    const message = buildInviteMessage(context, guest);
    expect(message).toContain('Olá, Família Silva!');
    expect(message).toContain('no dia 15 de janeiro de 2027');
    expect(message).toContain(guest.link);
    expect(message).toContain('Braúlio e Nanda');
    expect(message).not.toMatch(/\{\w+\}/);
    expect(buildInviteMessage({ ...context, phase: 'SAVE_THE_DATE' }, guest)).toContain(
      'Reserve a data',
    );
    expect(defaultInviteMessage('SAVE_THE_DATE')).not.toBe(defaultInviteMessage('INVITATION'));
  });

  it('uses the couple’s own text', () => {
    expect(
      buildInviteMessage(
        { ...context, template: '{convidado}, veja: {link} ({noivos}, {data})' },
        guest,
      ),
    ).toBe(`Família Silva, veja: ${guest.link} (Braúlio e Nanda, 15 de janeiro de 2027)`);
  });

  it('always carries the link, even when the text forgets it', () => {
    expect(buildInviteMessage({ ...context, template: 'Olá {convidado}!' }, guest)).toBe(
      `Olá Família Silva!\n\n${guest.link}`,
    );
  });

  it('opens WhatsApp with the message, to the guest or to a contact of choice', () => {
    expect(whatsappUrl('+244923456789', 'Olá & até já')).toBe(
      'https://wa.me/244923456789?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1',
    );
    expect(whatsappUrl('', 'Olá')).toBe('https://wa.me/?text=Ol%C3%A1');
  });
});
