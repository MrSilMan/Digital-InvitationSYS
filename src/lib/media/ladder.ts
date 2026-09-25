import type { MediaType } from './rules';

/**
 * Sizes of processed images. The worker writes a WebP file at every width of the type's ladder
 * below the image's own width, plus that width capped at the ladder's top (never enlarging):
 * `w480.webp`, `w960.webp`, `w1234.webp`… Pages get the widest file and the list of widths, and
 * `MediaImage` lets the browser pick among those files.
 */

export type ImageMediaType = Exclude<MediaType, 'MUSIC'>;

export const IMAGE_LADDERS: Record<ImageMediaType, readonly number[]> = {
  /** Carousel on phones (480, 960), full-screen lightbox (1600). */
  GALLERY: [480, 960, 1600],
  /** Full width of the invitation (at most 480 CSS px), 1x and 2x screens. */
  HERO: [540, 1080],
  /** Shown about 100 CSS px wide. */
  LOGO: [240, 480],
};

/** Tallest file written: very tall pictures (screenshots, panoramas) get narrower files instead. */
export const MAX_IMAGE_HEIGHT = 3200;

/** The widths the worker writes for an upright image of `size` pixels. */
export function variantWidths(
  size: { width: number; height: number },
  type: ImageMediaType,
): number[] {
  const ladder = IMAGE_LADDERS[type];
  const top = ladder[ladder.length - 1] ?? 1;
  const widthForMaxHeight = Math.floor((size.width * MAX_IMAGE_HEIGHT) / size.height);
  const max = Math.max(1, Math.min(Math.round(size.width), widthForMaxHeight, top));
  return [...ladder.filter((width) => width < max), max];
}

/** The smallest of `widths` covering `requested`, else the widest. */
export function pickWidth(requested: number, widths: readonly number[]): number {
  const sorted = [...widths].sort((a, b) => a - b);
  return sorted.find((width) => width >= requested) ?? sorted[sorted.length - 1] ?? requested;
}

const PROCESSED_SRC = /^(\/m\/(?:[a-z0-9-]+\/)+)w\d+\.webp$/;

/** The folder of a processed image (`/m/<event>/<media>/` for `…/w960.webp`), else null. */
export function processedFolder(src: string): string | null {
  return PROCESSED_SRC.exec(src)?.[1] ?? null;
}
