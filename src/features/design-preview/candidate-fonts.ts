import {
  Allison,
  Allura,
  Cinzel,
  Cormorant_Garamond,
  Cormorant_SC,
  EB_Garamond,
  Ephesis,
  Great_Vibes,
  Mea_Culpa,
  Parisienne,
} from 'next/font/google';

/**
 * Candidates compared on /design. Only that internal page imports this module, so guest pages
 * never download these files; `preload: false` keeps even /design from preloading all of them.
 */

const allura = Allura({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const parisienne = Parisienne({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});
const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});
const allison = Allison({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const ephesis = Ephesis({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const meaCulpa = Mea_Culpa({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const cormorantSc = Cormorant_SC({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap', preload: false });
const cormorantGaramond = Cormorant_Garamond({
  weight: ['500', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});
const ebGaramond = EB_Garamond({ subsets: ['latin'], display: 'swap', preload: false });

export interface FontCandidate {
  name: string;
  className: string;
  /** Listed in the project brief (the others were added because they look closer). */
  inBrief: boolean;
}

export const SCRIPT_CANDIDATES: readonly FontCandidate[] = [
  { name: 'Allura', className: allura.className, inBrief: true },
  { name: 'Parisienne', className: parisienne.className, inBrief: true },
  { name: 'Great Vibes', className: greatVibes.className, inBrief: true },
  { name: 'Allison', className: allison.className, inBrief: false },
  { name: 'Ephesis', className: ephesis.className, inBrief: false },
  { name: 'Mea Culpa', className: meaCulpa.className, inBrief: false },
];

export const CAPS_CANDIDATES: readonly FontCandidate[] = [
  { name: 'Cormorant SC', className: cormorantSc.className, inBrief: true },
  { name: 'Cinzel', className: cinzel.className, inBrief: true },
];

export const BODY_CANDIDATES: readonly FontCandidate[] = [
  { name: 'Cormorant Garamond', className: cormorantGaramond.className, inBrief: true },
  { name: 'EB Garamond', className: ebGaramond.className, inBrief: true },
];
