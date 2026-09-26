import { describe, expect, it } from 'vitest';

import { contactUrl, contactWhatsapp, PLACEHOLDER_CONTACT_WHATSAPP } from './contact';

describe("the team's WhatsApp link", () => {
  it('uses the configured number, or the unassigned demo number', () => {
    expect(contactWhatsapp('+244923456789')).toBe('+244923456789');
    expect(contactWhatsapp(undefined)).toBe(PLACEHOLDER_CONTACT_WHATSAPP);
    expect(PLACEHOLDER_CONTACT_WHATSAPP).toMatch(/^\+244900000\d{3}$/);
  });

  it('opens a chat with a pre-filled message', () => {
    const url = new URL(contactUrl('+244923456789'));
    expect(url.origin + url.pathname).toBe('https://wa.me/244923456789');
    expect(url.searchParams.get('text')).toBe(
      'Olá! Gostaríamos de criar o nosso convite de casamento digital.',
    );
  });

  it('names the theme the couple chose', () => {
    const url = new URL(contactUrl('+244923456789', 'Champanhe'));
    expect(url.searchParams.get('text')).toBe(
      'Olá! Gostaríamos de criar o nosso convite de casamento digital com o tema Champanhe.',
    );
  });
});
