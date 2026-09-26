import type { ThemeDefinition } from './types';

const asset = (file: string) => `/themes/imbondeiro/${file}`;

/**
 * "Imbondeiro": warm sand watercolour paper, terracotta script titles, rust accents, dark brown
 * text, king proteas with dried palm fans and savanna grass in the corners, a baobab (imbondeiro)
 * at sunset at the bottom of the hero pages and round buttons. No reference screenshot exists: it
 * follows Praia Rosa's layout. The artwork files are placeholders until the licensed artwork
 * replaces them (README → Themes).
 */
export const imbondeiro: ThemeDefinition = {
  id: 'imbondeiro',
  name: 'Imbondeiro',
  colors: {
    background: '#f6ebdc',
    ink: '#2e1f17',
    muted: '#5f4a3c',
    script: '#b0512b',
    accent: '#9c4523',
    accentContrast: '#ffffff',
    line: '#6f4a34',
  },
  envelope: { paper: '#fbf4ea', shade: '#e3cdb3', seal: '#9c4523', sealInk: '#f8dcc6' },
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
        image: 'corner',
        position: 'top-left',
        width: '38%',
        maxWidth: 220,
        offset: { x: -6, y: -6 },
      },
    ],
    invitation: [
      {
        image: 'cornerAlt',
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
        position: 'top-right',
        width: '34%',
        maxWidth: 200,
        offset: { x: -6, y: -6 },
      },
    ],
    guestManual: [
      {
        image: 'corner',
        position: 'top-right',
        width: '40%',
        maxWidth: 240,
        offset: { x: -8, y: -8 },
      },
      {
        image: 'cornerAlt',
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
  hero: { src: asset('hero-baobab.webp'), width: 1080, height: 900 },
  buttonShape: 'circle',
};
