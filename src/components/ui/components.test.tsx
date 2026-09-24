import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DateLine } from '@/components/ui/date-line';
import { DottedNameLine } from '@/components/ui/dotted-name-line';
import { Monogram, monogramLetters } from '@/components/ui/monogram';
import { PillButton } from '@/components/ui/pill-button';
import { QuoteBox } from '@/components/ui/quote-box';
import { SectionTitle } from '@/components/ui/section-title';
import { SerpentineTimeline } from '@/components/ui/serpentine-timeline';

/** Text as a screen reader gets it: tags removed, whitespace collapsed. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

describe('SectionTitle', () => {
  it('reads as one heading: script word, then the small-caps subtitle', () => {
    const html = renderToStaticMarkup(<SectionTitle script="Mensagem" caps="dos noivos" />);
    expect(html).toMatch(/^<h2[\s>]/);
    expect(text(html)).toBe('Mensagem dos noivos');
  });

  it('can be another heading level, with a decorative icon', () => {
    const html = renderToStaticMarkup(<SectionTitle as="h1" icon="camera" script="Galeria" />);
    expect(html).toMatch(/^<h1[\s>]/);
    expect(html).toContain('aria-hidden="true"');
    expect(text(html)).toBe('Galeria');
  });
});

describe('PillButton', () => {
  it('opens external links in a new tab without leaking the invitation URL', () => {
    const html = renderToStaticMarkup(
      <PillButton href="https://maps.google.com/?q=Luanda" external icon="map-pin">
        <strong>Google</strong> Maps
      </PillButton>,
    );
    expect(html).toMatch(/^<a /);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(text(html)).toBe('Google Maps');
  });

  it('is a plain button (never a submit) without href', () => {
    const html = renderToStaticMarkup(
      <PillButton icon="check-circle" disabled>
        Confirmar <strong>presença</strong>
      </PillButton>,
    );
    expect(html).toMatch(/^<button type="button"/);
    expect(html).toContain('disabled=""');
    expect(text(html)).toBe('Confirmar presença');
  });
});

describe('DottedNameLine', () => {
  it("shows the guest's name; the dotted line is decorative", () => {
    const html = renderToStaticMarkup(<DottedNameLine name="Família Silva" />);
    expect(text(html)).toBe('Família Silva');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('DateLine', () => {
  const startsAt = new Date('2027-01-15T15:00:00Z'); // 16:00 in Luanda

  it('shows the date in Luanda time with a machine-readable value', () => {
    const html = renderToStaticMarkup(<DateLine date={startsAt} />);
    expect(html).toMatch(/<time datetime="2027-01-15T16:00\+01:00"/i);
    expect(text(html)).toBe('15 janeiro 2027');
  });

  it('adds the weekday and time on request', () => {
    const html = renderToStaticMarkup(<DateLine date={startsAt} withWeekday />);
    expect(text(html)).toBe('15 janeiro 2027 SEXTA-FEIRA, ÀS 16H00');
  });
});

describe('QuoteBox', () => {
  it('keeps the message as a quotation with decorative marks', () => {
    const html = renderToStaticMarkup(
      <QuoteBox caption="Braúlio e Nanda">O amor é um presente de Deus.</QuoteBox>,
    );
    expect(html).toContain('<blockquote');
    expect(html).toContain('<figcaption');
    expect(text(html)).toBe('O amor é um presente de Deus. Braúlio e Nanda');
  });
});

describe('Monogram', () => {
  it.each([
    ['BN', ['B', 'N']],
    ['b & n', ['B', 'N']],
    ['élia', ['É', 'L']],
    ['A', ['A']],
    ['12', []],
  ])('takes the first two letters of "%s"', (initials, letters) => {
    expect(monogramLetters(initials)).toEqual(letters);
  });

  it('is decorative, and renders nothing without letters', () => {
    expect(renderToStaticMarkup(<Monogram initials="BN" />)).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<Monogram initials="&" />)).toBe('');
  });
});

describe('SerpentineTimeline', () => {
  const items = [
    { label: 'Chegada dos convidados', time: '15h30', icon: 'guests' },
    { label: 'Chegada dos noivos', time: '16h00', icon: 'bride-groom' },
    { label: 'Sessão de fotos', time: '17h00', icon: 'camera-heart' },
    { label: 'Abertura do buffet', time: '20h00', icon: 'buffet' },
    { label: 'Corte do bolo', icon: 'cake' },
  ];

  it('lists the items in chronological order, whatever the visual snake', () => {
    const html = renderToStaticMarkup(<SerpentineTimeline items={items} />);
    const listItems = html.match(/<li\s[\s\S]*?<\/li>/g) ?? [];
    expect(listItems.map(text)).toEqual([
      'Chegada dos convidados 15h30',
      'Chegada dos noivos 16h00',
      'Sessão de fotos 17h00',
      'Abertura do buffet 20h00',
      'Corte do bolo',
    ]);
    expect(html).toContain('<ol');
  });

  it('draws the lines for both layouts, hidden from screen readers', () => {
    const html = renderToStaticMarkup(<SerpentineTimeline items={items} />);
    const lines = html.match(/<svg[^>]*preserveAspectRatio="none"[^>]*>/g) ?? [];
    expect(lines).toHaveLength(2);
    for (const line of lines) expect(line).toContain('aria-hidden="true"');
  });

  it('renders nothing without items', () => {
    expect(renderToStaticMarkup(<SerpentineTimeline items={[]} />)).toBe('');
  });
});
