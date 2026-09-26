import type { ThemeDefinition } from './types';

const asset = (file: string) => `/themes/jardim/${file}`;

/**
 * "Jardim": pale sage watercolour paper, forest-green script titles, olive-green accents, white
 * roses with baby's breath, eucalyptus and olive sprigs in the corners, a garden pergola at the
 * bottom of the hero pages and pill buttons. No reference screenshot exists: it follows Praia
 * Rosa's layout. The artwork files are placeholders until the licensed artwork replaces them
 * (README → Themes).
 */
export const jardim: ThemeDefinition = {
  id: 'jardim',
  name: 'Jardim',
  colors: {
    background: '#edf2e9',
    ink: '#1e2a22',
    muted: '#4a584e',
    script: '#3f6e52',
    accent: '#52703c',
    accentContrast: '#ffffff',
    line: '#34473b',
  },
  envelope: { paper: '#fbfaf5', shade: '#d6dccd', seal: '#3f6e52', sealInk: '#e4efdf' },
  fonts: {
    script: 'var(--font-theme-script)',
    caps: 'var(--font-theme-caps)',
    body: 'var(--font-theme-body)',
    // Allura runs about 6% wider than Ephesis (its x-height is 0.295 em): drawn at 95%, the
    // couple's names on the closing page fit on one line, like in Praia Rosa.
    scriptSizeAdjust: 0.28,
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
        position: 'top-left',
        width: '42%',
        maxWidth: 250,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-right',
        width: '42%',
        maxWidth: 250,
        offset: { x: -8, y: -8 },
      },
    ],
    opening: [
      {
        image: 'corner',
        position: 'top-left',
        width: '50%',
        maxWidth: 300,
        offset: { x: -6, y: -6 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-right',
        width: '50%',
        maxWidth: 300,
        offset: { x: -6, y: -6 },
      },
    ],
    saveTheDate: [
      {
        image: 'corner',
        position: 'top-right',
        width: '38%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
    ],
    invitation: [
      {
        image: 'cornerAlt',
        position: 'top-right',
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
        image: 'cornerAlt',
        position: 'bottom-left',
        width: '36%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
      {
        image: 'corner',
        position: 'bottom-right',
        width: '36%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
    ],
    schedule: [
      {
        image: 'corner',
        position: 'top-left',
        width: '34%',
        maxWidth: 200,
        offset: { x: -6, y: -6 },
      },
    ],
    guestManual: [
      {
        image: 'cornerAlt',
        position: 'top-left',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'corner',
        position: 'bottom-right',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
    ],
    closing: [
      { image: 'garland', position: 'top', width: '78%', maxWidth: 460 },
      {
        image: 'cornerAlt',
        position: 'bottom-left',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
    ],
  },
  hero: { src: asset('hero-pergola.webp'), width: 1080, height: 900 },
  buttonShape: 'pill',
};
