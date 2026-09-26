/**
 * Building blocks of the placeholder theme artwork (scripts/generate-theme-placeholders.ts):
 * a seeded random generator and the WebP encoders.
 */
import sharp from 'sharp';

export type Random = () => number;

/** Deterministic random numbers (mulberry32): every run draws the same images. */
export function seeded(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rounds to 2 decimals, to keep the SVG source short. */
export const r2 = (value: number) => Math.round(value * 100) / 100;

export type Point = [number, number];

export const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** A gently curved stem: a quadratic curve from (x, y) towards `angle`, bent sideways by `bend`
 * (a share of the length). */
export function stem(x: number, y: number, length: number, angleDeg: number, bend: number) {
  const [ux, uy] = [Math.cos(radians(angleDeg)), Math.sin(radians(angleDeg))];
  const tip: Point = [x + ux * length, y + uy * length];
  const control: Point = [
    x + ux * length * 0.5 - uy * bend * length,
    y + uy * length * 0.5 + ux * bend * length,
  ];
  const at = (t: number): Point => [
    (1 - t) ** 2 * x + 2 * (1 - t) * t * control[0] + t ** 2 * tip[0],
    (1 - t) ** 2 * y + 2 * (1 - t) * t * control[1] + t ** 2 * tip[1],
  ];
  const tangent = (t: number): Point => {
    const dx = 2 * (1 - t) * (control[0] - x) + 2 * t * (tip[0] - control[0]);
    const dy = 2 * (1 - t) * (control[1] - y) + 2 * t * (tip[1] - control[1]);
    const norm = Math.hypot(dx, dy) || 1;
    return [dx / norm, dy / norm];
  };
  const d = `M${r2(x)} ${r2(y)} Q${r2(control[0])} ${r2(control[1])} ${r2(tip[0])} ${r2(tip[1])}`;
  return { at, tangent, d };
}

/** One file of a theme's placeholder artwork. */
export interface ArtworkFile {
  /** File name in public/themes/<theme>/. */
  file: string;
  width: number;
  height: number;
  /** Draws and encodes the file (WebP). */
  render: () => Promise<Buffer>;
}

/** An SVG drawing as WebP; `alpha` keeps the transparency (florals, hero illustration). */
export function svgArtwork(
  file: string,
  width: number,
  height: number,
  svg: () => string,
  alpha = true,
): ArtworkFile {
  return {
    file,
    width,
    height,
    render: () =>
      sharp(Buffer.from(svg()))
        .resize(width, height)
        .webp(alpha ? { quality: 80, alphaQuality: 85, effort: 6 } : { quality: 72, effort: 6 })
        .toBuffer(),
  };
}

/**
 * The paper texture repeats vertically under every section. Its top half is drawn, the bottom half
 * is the same image flipped: the tile's edges then always meet a mirror of themselves (no seam).
 */
export function paperTexture(
  file: string,
  width: number,
  height: number,
  background: string,
  halfSvg: (width: number, height: number) => string,
): ArtworkFile {
  return {
    file,
    width,
    height,
    render: async () => {
      const half = await sharp(Buffer.from(halfSvg(width, height / 2)))
        .png()
        .toBuffer();
      const mirrored = await sharp(half).flip().png().toBuffer();
      return sharp({ create: { width, height, channels: 3, background } })
        .composite([
          { input: half, top: 0, left: 0 },
          { input: mirrored, top: height / 2, left: 0 },
        ])
        .webp({ quality: 72, effort: 6 })
        .toBuffer();
    },
  };
}
