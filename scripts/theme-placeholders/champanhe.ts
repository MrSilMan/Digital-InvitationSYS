/**
 * Placeholder artwork of "Champanhe": warm ivory watercolour paper, cream roses with pampas grass,
 * eucalyptus and a few gilded leaves, and a floral moon-gate arch for the hero pages
 * (README → Themes → Artwork).
 */
import {
  paperTexture,
  r2,
  radians,
  seeded,
  stem,
  svgArtwork,
  type ArtworkFile,
  type Point,
  type Random,
} from './shared';

const DEFS = `
  <filter id="watercolor" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="17" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="shifted"/>
    <feGaussianBlur in="shifted" stdDeviation="0.6"/>
  </filter>
  <radialGradient id="roseIvory" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#c9a47b"/>
    <stop offset="35%" stop-color="#e6d0b0"/>
    <stop offset="75%" stop-color="#f5eadb"/>
    <stop offset="100%" stop-color="#fdf8f0"/>
  </radialGradient>
  <radialGradient id="roseChampagne" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#bb8d5f"/>
    <stop offset="40%" stop-color="#dfbf98"/>
    <stop offset="100%" stop-color="#f7e9d6"/>
  </radialGradient>
  <radialGradient id="roseBlush" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#cf9a86"/>
    <stop offset="45%" stop-color="#ebc8b8"/>
    <stop offset="100%" stop-color="#fbeee6"/>
  </radialGradient>
  <linearGradient id="euca" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8fa088"/>
    <stop offset="100%" stop-color="#c2ceb8"/>
  </linearGradient>
  <linearGradient id="gilded" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#b8924a"/>
    <stop offset="100%" stop-color="#e3c98f"/>
  </linearGradient>
`;

const PETAL_EDGE = '#d2b995';

/** A cream rose: five outer petals around a cup with a swirl. */
function rose(cx: number, cy: number, radius: number, fill: string, random: Random): string {
  const start = random() * Math.PI * 2;
  const edge = `stroke="${PETAL_EDGE}" stroke-width="${r2(radius * 0.03)}"`;
  const petals = Array.from({ length: 5 }, (_, i) => {
    const angle = start + (i / 5) * Math.PI * 2 + (random() - 0.5) * 0.4;
    const px = cx + Math.cos(angle) * radius * 0.45;
    const py = cy + Math.sin(angle) * radius * 0.45;
    const degrees = (angle * 180) / Math.PI;
    return `<ellipse cx="${r2(px)}" cy="${r2(py)}" rx="${r2(radius * 0.46)}" ry="${r2(radius * 0.58)}" transform="rotate(${r2(degrees)} ${r2(px)} ${r2(py)})" fill="url(#${fill})" ${edge}/>`;
  });
  const cup = `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(radius * 0.6)}" fill="url(#${fill})" ${edge}/>`;
  const turns = [0.48, 0.32, 0.18].map((scale, i) => {
    const rr = radius * scale;
    const from = random() * Math.PI * 2;
    const sweep = Math.PI * (1.1 + random() * 0.5);
    const [x1, y1] = [cx + rr * Math.cos(from), cy + rr * Math.sin(from)];
    const [x2, y2] = [cx + rr * Math.cos(from + sweep), cy + rr * Math.sin(from + sweep)];
    return `<path d="M${r2(x1)} ${r2(y1)} A${r2(rr)} ${r2(rr)} 0 0 1 ${r2(x2)} ${r2(y2)}" fill="none" stroke="#9a7350" stroke-opacity="0.5" stroke-width="${r2(radius * (0.05 - i * 0.01))}" stroke-linecap="round"/>`;
  });
  return `<g>${petals.join('')}${cup}${turns.join('')}</g>`;
}

/**
 * A feathery pampas plume on the upper 70% of the stem: an opaque silhouette through the tips of
 * fronds that lean towards the tip, with the fronds drawn inside it. Keeping the silhouette opaque
 * puts the fine detail in the colour channels: soft semi-transparent fronds would make the alpha
 * channel (which the image optimizer keeps lossless) several times heavier.
 */
function pampas(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  bend: number,
  random: Random,
): string {
  const { at, tangent, d } = stem(x, y, length, angleDeg, bend);
  const plumeStart = 0.3;
  const count = Math.round(length / 3.2);
  const fronds: string[] = [];
  const outline: Record<'left' | 'right', Point[]> = { left: [], right: [] };
  for (let i = 0; i <= count; i += 1) {
    const t = plumeStart + ((1 - plumeStart) * i) / count;
    // 0 at the plume's base, 1 at its tip: widest a little below the middle.
    const u = (t - plumeStart) / (1 - plumeStart);
    const half = length * (0.11 * Math.sin(Math.PI * u ** 0.75) + 0.008);
    const [px, py] = at(t);
    const [tx, ty] = tangent(t);
    for (const side of ['left', 'right'] as const) {
      const spread = radians(25 + random() * 25) * (side === 'left' ? -1 : 1);
      const [dx, dy] = [
        tx * Math.cos(spread) - ty * Math.sin(spread),
        tx * Math.sin(spread) + ty * Math.cos(spread),
      ];
      const reach = (half * (0.8 + random() * 0.45)) / Math.sin(Math.abs(spread));
      fronds.push(`M${r2(px)} ${r2(py)}l${r2(dx * reach * 0.92)} ${r2(dy * reach * 0.92)}`);
      if (i % 3 === 0) outline[side].push([px + dx * reach, py + dy * reach]);
    }
  }
  const silhouette = [at(plumeStart), ...outline.left, at(1), ...outline.right.reverse()]
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${r2(px)} ${r2(py)}`)
    .join('');
  return `<g><path d="${d}" fill="none" stroke="#b39468" stroke-width="${r2(Math.max(1.5, length * 0.008))}" stroke-linecap="round"/><path d="${silhouette}Z" fill="#e4d2b1" stroke="#e4d2b1" stroke-width="2" stroke-linejoin="round"/><g fill="none" stroke-linecap="round"><path d="${fronds.join('')}" stroke="#c9ab80" stroke-width="1.6"/><path d="${fronds.filter((_, i) => i % 3 === 0).join('')}" stroke="#f3e9d6" stroke-width="1.1"/></g></g>`;
}

/** A eucalyptus stem: round leaves in alternating pairs, smaller towards the tip. */
function eucalyptus(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  bend: number,
  leafRadius: number,
  random: Random,
): string {
  const { at, tangent, d } = stem(x, y, length, angleDeg, bend);
  const count = Math.max(4, Math.round(length / (leafRadius * 1.5)));
  const leaves = Array.from({ length: count }, (_, i) => {
    const t = 0.12 + (0.88 * i) / (count - 1);
    const [px, py] = at(t);
    const [tx, ty] = tangent(t);
    const side = i % 2 === 0 ? 1 : -1;
    const radius = leafRadius * (1 - 0.45 * t) * (0.85 + random() * 0.3);
    const [lx, ly] = [px - ty * side * radius * 0.85, py + tx * side * radius * 0.85];
    return `<ellipse cx="${r2(lx)}" cy="${r2(ly)}" rx="${r2(radius)}" ry="${r2(radius * 0.86)}" fill="url(#euca)" stroke="#9aa991" stroke-width="1"/>`;
  });
  return `<g><path d="${d}" fill="none" stroke="#7f8f77" stroke-width="2.4" stroke-linecap="round"/>${leaves.join('')}</g>`;
}

/** A slender dried leaf, painted gold. */
function gildedLeaf(x: number, y: number, length: number, angleDeg: number): string {
  const w = length * 0.22;
  return `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(angleDeg)})"><path d="M0 0 C${r2(length * 0.3)} ${r2(-w)} ${r2(length * 0.72)} ${r2(-w)} ${r2(length)} 0 C${r2(length * 0.72)} ${r2(w)} ${r2(length * 0.3)} ${r2(w)} 0 0 Z" fill="url(#gilded)"/><path d="M${r2(length * 0.06)} 0 L${r2(length * 0.9)} 0" stroke="#8c6b2d" stroke-opacity="0.4" stroke-width="${r2(Math.max(1, length * 0.02))}"/></g>`;
}

/** Bunny-tail grass: a thin stem with a soft oval tuft. */
function bunnyTail(x: number, y: number, length: number, angleDeg: number): string {
  const [ux, uy] = [Math.cos(radians(angleDeg)), Math.sin(radians(angleDeg))];
  const [ex, ey] = [x + ux * length, y + uy * length];
  return `<g><path d="M${r2(x)} ${r2(y)}L${r2(ex)} ${r2(ey)}" stroke="#b39468" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="${r2(ex)}" cy="${r2(ey)}" rx="${r2(length * 0.12)}" ry="${r2(length * 0.065)}" transform="rotate(${r2(angleDeg)} ${r2(ex)} ${r2(ey)})" fill="#f1e6d0" stroke="#d9c7a6" stroke-width="1.2"/></g>`;
}

interface Arrangement {
  /** x, y, radius, gradient */
  roses: [number, number, number, string][];
  /** x, y, length, angle, bend */
  pampas: [number, number, number, number, number][];
  /** x, y, length, angle, bend, leaf radius */
  eucalyptus: [number, number, number, number, number, number][];
  /** x, y, length, angle */
  gilded: [number, number, number, number][];
  /** x, y, length, angle */
  tails: [number, number, number, number][];
}

/** Back to front: pampas, eucalyptus, gilded leaves, grass, roses. */
function arrangement(layout: Arrangement, random: Random): string {
  return [
    ...layout.pampas.map(([x, y, length, angle, bend]) =>
      pampas(x, y, length, angle, bend, random),
    ),
    ...layout.eucalyptus.map(([x, y, length, angle, bend, leafRadius]) =>
      eucalyptus(x, y, length, angle, bend, leafRadius, random),
    ),
    ...layout.gilded.map(([x, y, length, angle]) => gildedLeaf(x, y, length, angle)),
    ...layout.tails.map(([x, y, length, angle]) => bunnyTail(x, y, length, angle)),
    ...layout.roses.map(([x, y, radius, fill]) => rose(x, y, radius, fill, random)),
  ].join('');
}

/** Corner clusters are anchored at the top-left corner; the garland runs along the top edge.
 * Laid out small, then scaled so the flowers fill most of the canvas. */
const LAYOUTS = {
  corner: {
    scale: 1.5,
    roses: [
      [150, 120, 80, 'roseIvory'],
      [292, 66, 56, 'roseChampagne'],
      [84, 268, 50, 'roseBlush'],
      [240, 210, 34, 'roseIvory'],
    ],
    pampas: [
      [0, 20, 400, 14, 0.06],
      [10, 0, 420, 40, -0.05],
      [20, -10, 390, 64, 0.05],
      [0, 30, 330, 86, -0.05],
    ],
    eucalyptus: [
      [10, 10, 330, 24, 0.08, 16],
      [10, 10, 300, 68, -0.1, 15],
    ],
    gilded: [
      [180, 200, 70, 40],
      [300, 130, 60, 5],
      [120, 320, 64, 80],
    ],
    tails: [
      [230, 170, 90, 30],
      [180, 250, 95, 55],
      [320, 100, 80, 12],
    ],
  },
  cornerAlt: {
    scale: 1.5,
    roses: [
      [118, 150, 72, 'roseChampagne'],
      [262, 92, 52, 'roseIvory'],
      [70, 318, 44, 'roseIvory'],
      [210, 250, 30, 'roseBlush'],
    ],
    pampas: [
      [0, 10, 420, 22, 0.05],
      [0, 0, 400, 50, -0.06],
      [-10, 20, 360, 78, 0.06],
    ],
    eucalyptus: [
      [5, 5, 320, 6, -0.08, 15],
      [5, 5, 320, 56, 0.08, 15],
    ],
    gilded: [
      [240, 170, 64, 18],
      [130, 280, 66, 70],
    ],
    tails: [
      [260, 200, 90, 38],
      [160, 320, 90, 72],
    ],
  },
  garland: {
    scale: 1.3,
    roses: [
      [70, 110, 70, 'roseIvory'],
      [215, 70, 52, 'roseChampagne'],
      [360, 118, 64, 'roseIvory'],
      [520, 70, 46, 'roseBlush'],
      [650, 110, 40, 'roseChampagne'],
    ],
    pampas: [
      [330, 40, 480, 3, 0.04],
      [500, 60, 330, -4, -0.05],
      [200, 100, 260, 40, 0.06],
      [40, 120, 220, 78, -0.05],
      [620, 100, 220, 14, 0.05],
    ],
    eucalyptus: [
      [280, 70, 400, 6, -0.06, 15],
      [90, 100, 230, 60, 0.08, 14],
      [560, 80, 250, 10, 0.06, 13],
    ],
    gilded: [
      [420, 150, 64, 30],
      [700, 120, 60, 8],
      [240, 180, 64, 60],
    ],
    tails: [
      [470, 120, 85, 22],
      [310, 170, 85, 48],
      [740, 95, 80, 2],
    ],
  },
} satisfies Record<string, Arrangement & { scale: number }>;

function floralSvg(width: number, height: number, seed: number, layout: keyof typeof LAYOUTS) {
  const { scale, ...parts } = LAYOUTS[layout];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${DEFS}</defs><g transform="scale(${scale})"><g filter="url(#watercolor)">${arrangement(parts, seeded(seed))}</g></g></svg>`;
}

/** Warm ivory watercolour paper (half of the tile; paperTexture mirrors it to make it seamless). */
function paperSvg(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="washWarm" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0018 0.0042" numOctaves="3" seed="21" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.90  0 0 0 0 0.82  0 0 0 0 0.68  1.9 0 0 0 -0.9"/>
      </filter>
      <filter id="washLight" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0024 0.0058" numOctaves="3" seed="8" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.99  0 0 0 0 0.96  2.4 0 0 0 -1.05"/>
      </filter>
      <filter id="paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.52  0 0 0 0 0.40  0 0 0 0.08 0"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="#f7f0e4"/>
    <rect width="100%" height="100%" filter="url(#washWarm)"/>
    <rect width="100%" height="100%" filter="url(#washLight)"/>
    <rect width="100%" height="100%" filter="url(#paper)"/>
  </svg>`;
}

/** A gold moon-gate arch dressed with roses and pampas, on a soft ground wash. No sky: the page's
 * paper texture shows through above and inside the arch. */
function heroSvg(width: number, height: number): string {
  const random = seeded(61);
  const [cx, cy, ring] = [540, 520, 290];
  const upperLeft: Arrangement = {
    roses: [
      [300, 352, 50, 'roseIvory'],
      [352, 312, 36, 'roseChampagne'],
      [262, 404, 32, 'roseBlush'],
      [336, 380, 24, 'roseIvory'],
    ],
    pampas: [
      [300, 350, 260, 200, 0.05],
      [305, 345, 250, 235, -0.06],
      [310, 340, 220, 262, 0.05],
      [300, 360, 200, 165, -0.05],
    ],
    eucalyptus: [
      [300, 355, 230, 100, -0.12, 14],
      [310, 345, 210, 318, 0.1, 13],
    ],
    gilded: [
      [330, 330, 64, 250],
      [270, 380, 60, 190],
    ],
    tails: [[295, 345, 80, 215]],
  };
  const lowerRight: Arrangement = {
    roses: [
      [778, 686, 54, 'roseChampagne'],
      [730, 730, 40, 'roseIvory'],
      [818, 628, 34, 'roseIvory'],
      [748, 660, 26, 'roseBlush'],
    ],
    pampas: [
      [780, 680, 280, -10, 0.05],
      [775, 690, 240, 20, -0.05],
      [785, 675, 250, -40, 0.06],
    ],
    eucalyptus: [
      [785, 680, 230, -80, 0.12, 14],
      [770, 700, 180, 150, -0.1, 13],
    ],
    gilded: [[800, 700, 64, 10]],
    tails: [[790, 670, 84, -25]],
  };
  const floor = (x: number, mirror: 1 | -1): Arrangement => ({
    roses: [
      [x, 800, 42, 'roseChampagne'],
      [x + 40 * mirror, 818, 32, 'roseIvory'],
      [x - 38 * mirror, 818, 28, 'roseBlush'],
    ],
    pampas: [
      [x, 812, 300, mirror === 1 ? -112 : -68, 0.05],
      [x, 812, 260, mirror === 1 ? -140 : -40, -0.05],
      [x, 812, 280, mirror === 1 ? -92 : -88, 0.04],
    ],
    eucalyptus: [[x, 815, 170, mirror === 1 ? 190 : -10, 0.08, 13]],
    gilded: [],
    tails: [[x, 810, 90, mirror === 1 ? -125 : -55]],
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${DEFS}
      <radialGradient id="ground" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e6d4b4" stop-opacity="0.95"/>
        <stop offset="70%" stop-color="#eee2cb" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#f4ecde" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#b8924a"/>
        <stop offset="50%" stop-color="#e6cd92"/>
        <stop offset="100%" stop-color="#a98542"/>
      </linearGradient>
    </defs>
    <ellipse cx="540" cy="880" rx="640" ry="130" fill="url(#ground)"/>
    <ellipse cx="540" cy="836" rx="230" ry="18" fill="#b89c70" fill-opacity="0.25"/>
    <g filter="url(#watercolor)">
      <circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="url(#goldRing)" stroke-width="18"/>
      <circle cx="${cx}" cy="${cy}" r="${ring - 5}" fill="none" stroke="#f3e2b8" stroke-opacity="0.6" stroke-width="3"/>
      <rect x="392" y="806" width="296" height="24" rx="8" fill="url(#goldRing)"/>
      ${arrangement(floor(415, 1), random)}
      ${arrangement(floor(665, -1), random)}
      ${arrangement(upperLeft, random)}
      ${arrangement(lowerRight, random)}
    </g>
  </svg>`;
}

export const champanheArtwork: readonly ArtworkFile[] = [
  paperTexture('background.webp', 1080, 1920, '#f7f0e4', paperSvg),
  svgArtwork('floral-corner.webp', 640, 640, () => floralSvg(640, 640, 31, 'corner')),
  svgArtwork('floral-corner-alt.webp', 640, 640, () => floralSvg(640, 640, 43, 'cornerAlt')),
  svgArtwork('floral-garland.webp', 1080, 440, () => floralSvg(1080, 440, 53, 'garland')),
  svgArtwork('hero-arch.webp', 1080, 900, () => heroSvg(1080, 900)),
];
