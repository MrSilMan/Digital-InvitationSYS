import type { ThemeDefinition } from './types';

const asset = (file: string) => `/themes/praia-rosa/${file}`;

/**
 * "Praia Rosa": pale-blue watercolour paper, pink script titles, olive-gold accents, pink rose
 * florals in the corners and a beach wedding illustration at the bottom of the hero pages.
 * The artwork files are placeholders until the licensed artwork replaces them (README → Themes).
 */
export const praiaRosa: ThemeDefinition = {
  id: 'praia-rosa',
  name: 'Praia Rosa',
  colors: {
    background: '#e9f3f6',
    ink: '#1d2433',
    muted: '#4a5566',
    // Slightly deeper than the reference so large script text keeps ≥ 3:1 contrast.
    script: '#d95c91',
    // Slightly darker olive than the reference so white button text keeps ≥ 4.5:1 contrast.
    accent: '#7b7440',
    accentContrast: '#ffffff',
    line: '#2b3446',
  },
  fonts: {
    script: 'var(--font-theme-script)',
    caps: 'var(--font-theme-caps)',
    body: 'var(--font-theme-body)',
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
        width: '44%',
        maxWidth: 260,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-right',
        width: '44%',
        maxWidth: 260,
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
        image: 'corner',
        position: 'bottom-right',
        width: '50%',
        maxWidth: 300,
        offset: { x: -6, y: -6 },
      },
    ],
    saveTheDate: [
      {
        image: 'cornerAlt',
        position: 'top-right',
        width: '38%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
    ],
    invitation: [
      {
        image: 'corner',
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
        position: 'top-right',
        width: '34%',
        maxWidth: 200,
        offset: { x: -6, y: -6 },
      },
    ],
    guestManual: [
      {
        image: 'corner',
        position: 'top-left',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'cornerAlt',
        position: 'bottom-right',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
    ],
  },
  hero: { src: asset('hero-beach.webp'), width: 1080, height: 900 },
  buttonShape: 'pill',
};
