import type { SectionId } from '@/lib/validation/sections';

/** Places a theme can decorate: the two phase-specific screens and every invitation section. */
export type ThemeArea = 'opening' | 'saveTheDate' | SectionId;

export interface ThemeImage {
  /** Path under /public, e.g. "/themes/praia-rosa/floral-corner.webp". */
  src: string;
  width: number;
  height: number;
}

export type DecorationPosition =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom';

export interface Decoration {
  /** Key in `ThemeDefinition.images`. Artwork is drawn for the top-left corner (or the top edge);
   * the other positions mirror it, so one image serves every corner. */
  image: string;
  position: DecorationPosition;
  /** Rendered width relative to the section, e.g. "56%". */
  width: string;
  /** Upper bound on large screens, in CSS pixels. */
  maxWidth?: number;
  /** Shift beyond the edges, as a percentage of the image's own size (negative = outwards). */
  offset?: { x?: number; y?: number };
}

export interface ThemeColors {
  /** Page colour under the texture. */
  background: string;
  /** Body text. */
  ink: string;
  /** Secondary text. */
  muted: string;
  /** Script titles and the couple's names. */
  script: string;
  /** Buttons, icons, borders, dots. */
  accent: string;
  /** Text and icons on the accent colour. */
  accentContrast: string;
  /** Timeline line and connectors. */
  line: string;
}

/** The envelope of the opening screen. */
export interface EnvelopeColors {
  paper: string;
  /** Folds and edges on the paper. */
  shade: string;
  /** Wax seal. */
  seal: string;
  /** Monogram pressed into the seal. */
  sealInk: string;
}

export interface ThemeFonts {
  /** CSS font-family values: the `--font-theme-*` variables that src/themes/fonts.ts declares. */
  script: string;
  caps: string;
  body: string;
}

/**
 * A theme is plain data (no next/font import), so server code and tests can use it; ThemeRoot
 * attaches the font files (src/themes/fonts.ts).
 */
export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
  envelope: EnvelopeColors;
  fonts: ThemeFonts;
  /** Watercolour paper texture, repeated vertically behind every section. */
  texture?: ThemeImage;
  images: Record<string, ThemeImage>;
  /** Decorations per area; areas without an entry use `default`. */
  decorations: Partial<Record<ThemeArea, readonly Decoration[]>> & {
    default: readonly Decoration[];
  };
  /** Illustration at the bottom of the hero pages (Save the Date, invitation card). */
  hero: ThemeImage;
  /** Shape of the main call-to-action buttons. */
  buttonShape: 'pill' | 'circle';
}
