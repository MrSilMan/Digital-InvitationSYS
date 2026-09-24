import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { pillButtonClasses } from '@/components/ui/pill-button-classes';
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

// renderToStaticMarkup cannot wait for next/dynamic's lazy chunk (Next.js preloads it when it
// renders the page): render the form itself. The lazy loading is covered by the e2e tests.
vi.mock('@/features/invitation/rsvp/lazy-rsvp-form', async () => ({
  LazyRsvpForm: (await import('@/features/invitation/rsvp/rsvp-form')).RsvpForm,
}));

const basePath = '/c/braulio-e-nanda/demo-familia-silva-001';

function props(overrides: Partial<SectionProps> = {}): SectionProps {
  return {
    event: invitationEventFixture(),
    guest: guestFixture,
    rsvp: null,
    theme: getTheme('praia-rosa'),
    now: new Date('2026-09-24T10:00:00Z'),
    guestToken: 'demo-familia-silva-001',
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
  const withMode = (mode: 'WHATSAPP' | 'FORM' | 'BOTH') =>
    invitationEventFixture({ rsvp: { ...invitationEventFixture().rsvp, mode } });
  const whatsappLinks = (html: string) =>
    [...html.matchAll(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer"/g)].map(
      (match) => match[1],
    );
  const saved = {
    attending: true,
    peopleCount: 3,
    companionNames: ['Maria Silva', 'João Silva'],
    message: null,
    updatedAt: '2026-09-20T10:00:00.000Z',
  };

  it('offers the form, then WhatsApp through our tracking links (BOTH)', () => {
    const html = renderToStaticMarkup(<RsvpContent {...props({ event: withMode('BOTH') })} />);
    expect(text(html)).toContain('Por favor, confirme a sua presença até 31 de dezembro de 2026.');
    expect(text(html)).toContain('Vai estar presente?');
    expect(text(html)).toContain('Prefere confirmar pelo WhatsApp?');
    expect(whatsappLinks(html)).toEqual([
      `${basePath}/whatsapp/noivo`,
      `${basePath}/whatsapp/noiva`,
    ]);
  });

  it('shows only what the mode allows', () => {
    const whatsappOnly = renderToStaticMarkup(
      <RsvpContent {...props({ event: withMode('WHATSAPP') })} />,
    );
    expect(whatsappOnly).not.toContain('<form');
    expect(whatsappLinks(whatsappOnly)).toHaveLength(2);

    const formOnly = renderToStaticMarkup(<RsvpContent {...props({ event: withMode('FORM') })} />);
    expect(formOnly).toContain('<form');
    expect(whatsappLinks(formOnly)).toEqual([]);
  });

  it('shows the saved answer with a way to change it', () => {
    const html = renderToStaticMarkup(
      <RsvpContent {...props({ event: withMode('FORM'), rsvp: saved })} />,
    );
    expect(text(html)).toContain(
      'Obrigado, Família Silva! A presença está confirmada para 3 pessoas.',
    );
    expect(text(html)).toContain('Maria Silva · João Silva');
    expect(text(html)).toContain('Alterar a resposta');
  });

  it('closes after the deadline: no form, no buttons, the answer read-only', () => {
    const after = new Date('2027-01-01T00:00:00Z');
    const unanswered = renderToStaticMarkup(<RsvpContent {...props({ now: after })} />);
    expect(text(unanswered)).toBe(
      'O prazo para confirmar a presença terminou a 31 de dezembro de 2026.',
    );
    expect(whatsappLinks(unanswered)).toEqual([]);

    const answered = renderToStaticMarkup(<RsvpContent {...props({ now: after, rsvp: saved })} />);
    expect(text(answered)).toContain('confirmada para 3 pessoas');
    expect(text(answered)).not.toContain('Alterar a resposta');
  });

  it("never puts the guest's database id in the page", () => {
    const html = renderToStaticMarkup(<RsvpContent {...props()} />);
    expect(html).not.toContain(guestFixture.id);
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

describe('buttons', () => {
  const classAttribute = (shape: 'pill' | 'circle') =>
    `class="${pillButtonClasses(shape).replaceAll('&', '&amp;')}"`;
  /** The accent buttons of the page, by shape (other classes, like the form's, are left out). */
  const shapes = (html: string) =>
    (['pill', 'circle'] as const).flatMap((shape) =>
      Array.from({ length: html.split(classAttribute(shape)).length - 1 }, () => shape),
    );
  const render = (themeId: string) => {
    const theme = getTheme(themeId);
    const saveTheDate = invitationEventFixture({
      phase: 'SAVE_THE_DATE',
      rsvp: { ...invitationEventFixture().rsvp, mode: 'FORM' },
    });
    return {
      saveTheDate: shapes(
        renderToStaticMarkup(<SaveTheDatePage {...props({ theme, event: saveTheDate })} />),
      ),
      schedule: shapes(renderToStaticMarkup(<ScheduleSection {...props({ theme })} />)),
      closing: shapes(renderToStaticMarkup(<ClosingSection {...props({ theme })} />)),
      gifts: shapes(renderToStaticMarkup(<GiftsSection {...props({ theme })} />)),
      whatsapp: shapes(
        renderToStaticMarkup(
          <RsvpContent
            {...props({
              theme,
              event: invitationEventFixture({
                rsvp: { ...invitationEventFixture().rsvp, mode: 'WHATSAPP' },
              }),
            })}
          />,
        ),
      ),
    };
  };

  it("take the theme's shape for the main actions", () => {
    expect(render('praia-rosa')).toMatchObject({
      saveTheDate: ['pill'],
      schedule: ['pill', 'pill'],
      closing: ['pill'],
    });
    expect(render('champanhe')).toMatchObject({
      saveTheDate: ['circle'],
      schedule: ['circle', 'circle'],
      closing: ['circle'],
    });
  });

  it('stay round for WhatsApp and a pill for "Copiar IBAN" in every theme', () => {
    for (const themeId of ['praia-rosa', 'champanhe']) {
      expect(render(themeId)).toMatchObject({
        whatsapp: ['circle', 'circle'],
        gifts: ['pill'],
      });
    }
  });
});
