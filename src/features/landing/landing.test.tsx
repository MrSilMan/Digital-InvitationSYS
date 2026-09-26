import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

import { OG_SIZE } from '@/features/invitation/og/og-image';
import { landing } from '@/i18n/pt-AO';
import { THEMES, type ThemeId } from '@/themes';

import { Faq, FinalCall, HowItWorks } from './closing-sections';
import { contactUrl } from './contact';
import { CouplePreviewProvider } from './couple-preview';
import { Features } from './features';
import { GuestJourney } from './guest-journey';
import { Hero, Ribbon } from './hero';
import { renderLandingOgImage } from './og-image';
import { themeDemoPath, ThemeShowcase } from './theme-showcase';

// next/font only works inside the Next.js compiler: the theme fonts (src/themes/fonts.ts) become
// plain class names here.
vi.mock('next/font/google', () => {
  const font = ({ variable = '' }: { variable?: string }) => ({
    className: 'font',
    variable,
    style: { fontFamily: 'serif' },
  });
  return {
    Alegreya_SC: font,
    Allura: font,
    Carattere: font,
    Cinzel: font,
    Cormorant_SC: font,
    EB_Garamond: font,
    Ephesis: font,
    Great_Vibes: font,
  };
});

const phone = '+244923456789';
const contactHref = contactUrl(phone);
const date = new Date('2027-01-30T15:00:00Z');

const html = renderToStaticMarkup(
  <CouplePreviewProvider sample={landing.sampleCouple}>
    <Hero contactHref={contactHref} date={date} />
    <Ribbon />
    <ThemeShowcase contactPhone={phone} date={date} />
    <GuestJourney date={date} linkText="convites.ao/c/braulio-e-nanda/…" />
    <Features />
    <HowItWorks contactHref={contactHref} />
    <Faq />
    <FinalCall contactHref={contactHref} />
  </CouplePreviewProvider>,
);

const text = (markup: string) =>
  markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

describe('landing page', () => {
  it('has one main heading, the promise', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(text(html)).toContain('O vosso sim merece um convite à altura');
  });

  it('shows every theme, with its demo and a WhatsApp message that names it', () => {
    for (const themeId of Object.keys(THEMES) as ThemeId[]) {
      const { name } = THEMES[themeId];
      expect(html).toContain(`href="${themeDemoPath(themeId)}"`);
      expect(html).toContain(`href="${contactUrl(phone, name)}"`);
      expect(text(html)).toContain(landing.themes.items[themeId].tagline);
    }
  });

  it("sends every call to the team's WhatsApp, in a new tab", () => {
    const links = [...html.matchAll(/<a [^>]*data-contact-whatsapp[^>]*>/g)].map(([tag]) => tag);
    expect(links.length).toBeGreaterThanOrEqual(5);
    for (const link of links) {
      expect(link).toContain('href="https://wa.me/244923456789?text=');
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener noreferrer"');
    }
  });

  it('leads couples with an account to the login', () => {
    expect(html).toContain('href="/entrar"');
  });

  it('shows the sample couple in the examples until a visitor types', () => {
    expect(text(html)).toContain('Braúlio e Nanda');
    expect(text(html)).toContain('Braúlio & Nanda');
  });

  it('answers every question', () => {
    for (const { question, answer } of landing.faq.items) {
      expect(text(html)).toContain(question);
      expect(text(html)).toContain(answer);
    }
  });

  it("hides the ribbon's second, scrolling copy from screen readers", () => {
    const ribbon = html.slice(html.indexOf(`aria-label="${landing.ribbon.label}"`));
    expect(ribbon.match(/<ul aria-hidden="true"/g)).toHaveLength(1);
  });

  it('has a small JPEG link preview image', async () => {
    const jpeg = await renderLandingOgImage();
    const { format, width, height } = await sharp(jpeg).metadata();
    expect({ format, width, height }).toEqual({ format: 'jpeg', ...OG_SIZE });
    expect(jpeg.length).toBeLessThan(300 * 1024);
  }, 20_000);
});
