import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ClosingSection } from '@/features/invitation/sections/closing-section';
import { GallerySection } from '@/features/invitation/sections/gallery-section';
import { GiftsSection } from '@/features/invitation/sections/gifts-section';
import { InvitationCardSection } from '@/features/invitation/sections/invitation-card';
import { RsvpContent } from '@/features/invitation/sections/rsvp-section';
import { SaveTheDatePage } from '@/features/invitation/sections/save-the-date';
import { ScheduleSection } from '@/features/invitation/sections/schedule-section';
import type { SectionProps } from '@/features/invitation/sections/types';
import { guestFixture, invitationEventFixture } from '@/features/invitation/test-fixtures';
import { getTheme } from '@/themes';

const basePath = '/c/braulio-e-nanda/demo-familia-silva-001';

function props(overrides: Partial<SectionProps> = {}): SectionProps {
  return {
    event: invitationEventFixture(),
    guest: guestFixture,
    theme: getTheme('praia-rosa'),
    now: new Date('2026-09-24T10:00:00Z'),
    basePath,
    ...overrides,
  };
}

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

describe('invitation card', () => {
  const html = renderToStaticMarkup(<InvitationCardSection {...props()} />);

  it("is personal: the guest's name and seats", () => {
    expect(text(html)).toContain('Família Silva');
    expect(text(html)).toContain('Convite válido para 4 pessoas');
  });

  it("shows both families, the couple's names and the date in Luanda time", () => {
    for (const name of ['Augusto Santos', 'Fernanda Cassoma', 'Braúlio e Nanda']) {
      expect(text(html)).toContain(name);
    }
    expect(html).toMatch(/datetime="2027-01-15T16:00\+01:00"/i);
  });

  it('is a labelled page whose first-screen images are preloaded', () => {
    expect(html).toContain('<section aria-labelledby="secao-convite"');
    // React adds preload hints for the eager florals and the hero illustration.
    expect(html.match(/<link rel="preload" as="image"/g)).toHaveLength(2);
  });
});

describe('RSVP', () => {
  const now = new Date('2026-09-24T10:00:00Z');

  it("opens WhatsApp chats with the couple, with the guest's name in the message", () => {
    const html = renderToStaticMarkup(
      <RsvpContent event={invitationEventFixture()} guest={guestFixture} now={now} />,
    );
    const links = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map((match) =>
      decodeURIComponent((match[1] ?? '').replace(/&amp;/g, '&')),
    );
    expect(links).toEqual([
      'https://wa.me/244900000001?text=Olá! Sou Família Silva e confirmo a minha presença no casamento de Braúlio e Nanda.',
      'https://wa.me/244900000002?text=Olá! Sou Família Silva e confirmo a minha presença no casamento de Braúlio e Nanda.',
    ]);
    expect(text(html)).toContain('Por favor, confirme a sua presença até 31 de dezembro de 2026.');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('says so, without buttons, once the deadline has passed', () => {
    const html = renderToStaticMarkup(
      <RsvpContent
        event={invitationEventFixture()}
        guest={guestFixture}
        now={new Date('2027-01-01T00:00:00Z')}
      />,
    );
    expect(text(html)).toBe('O prazo para confirmar a presença terminou a 31 de dezembro de 2026.');
    expect(html).not.toContain('wa.me');
  });
});

describe('schedule', () => {
  const html = renderToStaticMarkup(<ScheduleSection {...props()} />);

  it("puts the venue in bold in the couple's sentence", () => {
    expect(html).toContain('Terão lugar na <strong>Praia do Bispo</strong>, às 16h00.');
    expect(html).toContain(
      'Será realizado às 20h00, no <strong>Salão de Festas Jardim das Rosas</strong>, Morro Bento.',
    );
  });

  it('offers Waze only where there are coordinates', () => {
    expect(html.match(/waze\.com\/ul/g)).toHaveLength(1);
  });
});

describe('gifts', () => {
  it('shows the IBAN and copies it without spaces', () => {
    const html = renderToStaticMarkup(<GiftsSection {...props()} />);
    expect(text(html)).toContain('AO06 0000 0000 0000 0000 0000 0');
    expect(text(html)).toContain('Titular: Braúlio Santos');
    expect(text(html)).toContain('Copiar IBAN');
  });
});

describe('gallery', () => {
  it('labels every photo and lays out the first frame on the server', () => {
    const html = renderToStaticMarkup(<GallerySection {...props()} />);
    expect(html).toContain('aria-label="Ver a foto 1 em ecrã inteiro"');
    expect(html).toContain('alt="Foto 1 de 2"');
    expect(html).toContain('alt="Na praia"');
    expect(html).toContain('translate3d(19%, 0, 0)');
  });
});

describe('closing', () => {
  it('links to the guest’s own calendar file and to Google Calendar', () => {
    const html = renderToStaticMarkup(<ClosingSection {...props()} />);
    expect(html).toContain(`href="${basePath}/calendario.ics"`);
    expect(html).toContain('download="casamento-braulio-e-nanda.ics"');
    expect(html).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
  });
});

describe('Save the Date', () => {
  it('shows the date and a way to confirm, but no invitation details', () => {
    const html = renderToStaticMarkup(
      <SaveTheDatePage {...props({ event: invitationEventFixture({ phase: 'SAVE_THE_DATE' }) })} />,
    );
    expect(text(html)).toContain('Save the date');
    expect(text(html)).toContain('Convite oficial em breve');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(text(html)).not.toContain('Praia do Bispo');
  });
});
