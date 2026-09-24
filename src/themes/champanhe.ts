import type { ThemeDefinition } from './types';

const asset = (file: string) => `/themes/champanhe/${file}`;

/**
 * "Champanhe": warm ivory paper, antique-gold accents and script titles, dark serif text, cream
 * roses with pampas grass in the corners, a floral arch at the bottom of the hero pages and round
 * gold buttons. No reference screenshot exists: it follows the brief with Praia Rosa's layout.
 * The artwork files are placeholders until the licensed artwork replaces them (README → Themes).
 */
export const champanhe: ThemeDefinition = {
  id: 'champanhe',
  name: 'Champanhe',
  colors: {
    background: '#f7f0e4',
    ink: '#2b2520',
    muted: '#5e5247',
    // Real champagne gold is too pale on ivory: these are the lightest golds that keep large
    // script text at ≥ 3:1 and white button labels at ≥ 4.5:1.
    script: '#a17b3b',
    accent: '#8c6b2d',
    accentContrast: '#ffffff',
    line: '#7a6242',
  },
  envelope: { paper: '#fbf7ef', shade: '#e2d3b8', seal: '#a8843f', sealInk: '#fbf1da' },
  fonts: {
    script: 'var(--font-theme-script)',
    caps: 'var(--font-theme-caps)',
    body: 'var(--font-theme-body)',
    // Cinzel's small capitals are 0.5 em tall and its lines about 22% longer than Cormorant SC's:
    // drawn at 84%, parents' names and the seats note fit on one line again.
    capsSizeAdjust: 0.42,
  },
  texture: { src: asset('background.webp'), width: 1080, height: 1920 },
  images: {
    corner: { src: asset('floral-corner.webp'), width: 640, height: 640 },
    cornerAlt: { src: asset('floral-corner-alt.webp'), width: 640, height: 640 },
    garland: { src: asset('floral-garland.webp'), width: 1080, height: 440 },
  },
  decorations: {
    default: [
      {
        image: 'corner',
        position: 'top-right',
        width: '42%',
        maxWidth: 250,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-left',
        width: '42%',
        maxWidth: 250,
        offset: { x: -8, y: -8 },
      },
    ],
    opening: [
      {
        image: 'corner',
        position: 'top-right',
        width: '50%',
        maxWidth: 300,
        offset: { x: -6, y: -6 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-left',
        width: '50%',
        maxWidth: 300,
        offset: { x: -6, y: -6 },
      },
    ],
    saveTheDate: [
      {
        image: 'cornerAlt',
        position: 'top-left',
        width: '38%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
    ],
    invitation: [
      {
        image: 'corner',
        position: 'top-left',
        width: '40%',
        maxWidth: 240,
        offset: { x: -6, y: -6 },
      },
    ],
    message: [
      { image: 'garland', position: 'top', width: '78%', maxWidth: 460 },
      { image: 'garland', position: 'bottom', width: '64%', maxWidth: 380 },
    ],
    gallery: [
      {
        image: 'corner',
        position: 'bottom-left',
        width: '36%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-right',
        width: '36%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
    ],
    schedule: [
      {
        image: 'cornerAlt',
        position: 'top-left',
        width: '34%',
        maxWidth: 200,
        offset: { x: -6, y: -6 },
      },
    ],
    guestManual: [
      {
        image: 'cornerAlt',
        position: 'top-right',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'corner',
        position: 'bottom-left',
        width: '34%',
        maxWidth: 200,
        offset: { x: -8, y: -8 },
      },
    ],
    closing: [
      { image: 'garland', position: 'top', width: '78%', maxWidth: 460 },
      {
        image: 'corner',
        position: 'bottom-right',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
    ],
  },
  hero: { src: asset('hero-arch.webp'), width: 1080, height: 900 },
  buttonShape: 'circle',
};
