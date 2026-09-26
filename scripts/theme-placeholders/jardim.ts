/**
 * Placeholder artwork of "Jardim": pale sage watercolour paper, white roses with baby's breath,
 * eucalyptus, olive sprigs and ruscus greenery, and a wooden garden pergola for the hero pages
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
  type Random,
} from './shared';

const DEFS = `
  <filter id="watercolor" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="29" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="shifted"/>
    <feGaussianBlur in="shifted" stdDeviation="0.6"/>
  </filter>
  <radialGradient id="roseWhite" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#cdd3bd"/>
    <stop offset="35%" stop-color="#eaede0"/>
    <stop offset="75%" stop-color="#fafbf5"/>
    <stop offset="100%" stop-color="#ffffff"/>
  </radialGradient>
  <radialGradient id="roseCream" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#dccdaf"/>
    <stop offset="40%" stop-color="#f1e8d6"/>
    <stop offset="100%" stop-color="#fffbf3"/>
  </radialGradient>
  <radialGradient id="roseBlush" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#dcae9d"/>
    <stop offset="45%" stop-color="#f0d6ca"/>
    <stop offset="100%" stop-color="#fdf3ee"/>
  </radialGradient>
  <linearGradient id="euca" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#7a978a"/>
    <stop offset="100%" stop-color="#b7cbbf"/>
  </linearGradient>
  <linearGradient id="olive" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#56663f"/>
    <stop offset="100%" stop-color="#899868"/>
  </linearGradient>
  <linearGradient id="oliveSilver" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#96a283"/>
    <stop offset="100%" stop-color="#c6cdb3"/>
  </linearGradient>
  <linearGradient id="ruscus" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#3b6446"/>
    <stop offset="100%" stop-color="#7c9f76"/>
  </linearGradient>
`;

const PETAL_EDGE = '#c2c8b0';

/** A white garden rose: six outer petals around a cup with a swirl. */
function rose(cx: number, cy: number, radius: number, fill: string, random: Random): string {
  const start = random() * Math.PI * 2;
  const edge = `stroke="${PETAL_EDGE}" stroke-width="${r2(radius * 0.03)}"`;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const angle = start + (i / 6) * Math.PI * 2 + (random() - 0.5) * 0.35;
    const px = cx + Math.cos(angle) * radius * 0.48;
    const py = cy + Math.sin(angle) * radius * 0.48;
    const degrees = (angle * 180) / Math.PI;
    return `<ellipse cx="${r2(px)}" cy="${r2(py)}" rx="${r2(radius * 0.44)}" ry="${r2(radius * 0.54)}" transform="rotate(${r2(degrees)} ${r2(px)} ${r2(py)})" fill="url(#${fill})" ${edge}/>`;
  });
  const cup = `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(radius * 0.6)}" fill="url(#${fill})" ${edge}/>`;
  const turns = [0.5, 0.34, 0.2].map((scale, i) => {
    const rr = radius * scale;
    const from = random() * Math.PI * 2;
    const sweep = Math.PI * (1.1 + random() * 0.5);
    const [x1, y1] = [cx + rr * Math.cos(from), cy + rr * Math.sin(from)];
    const [x2, y2] = [cx + rr * Math.cos(from + sweep), cy + rr * Math.sin(from + sweep)];
    return `<path d="M${r2(x1)} ${r2(y1)} A${r2(rr)} ${r2(rr)} 0 0 1 ${r2(x2)} ${r2(y2)}" fill="none" stroke="#959c83" stroke-opacity="0.6" stroke-width="${r2(radius * (0.05 - i * 0.01))}" stroke-linecap="round"/>`;
  });
  return `<g>${petals.join('')}${cup}${turns.join('')}</g>`;
}

/**
 * A pointed leaf along +x from (x, y), turned by `angleDeg`; `width` is a share of the length.
 * Only broad leaves get a vein: on slender ones it is too fine to see and costs bytes.
 */
function leaf(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  width: number,
  fill: string,
): string {
  const w = length * width;
  const vein =
    width >= 0.25
      ? `<path d="M${r2(length * 0.06)} 0 L${r2(length * 0.88)} 0" stroke="#2f4a33" stroke-opacity="0.5" stroke-width="${r2(Math.max(1, length * 0.022))}"/>`
      : '';
  return `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(angleDeg)})"><path d="M0 0 C${r2(length * 0.3)} ${r2(-w)} ${r2(length * 0.74)} ${r2(-w)} ${r2(length)} 0 C${r2(length * 0.74)} ${r2(w)} ${r2(length * 0.3)} ${r2(w)} 0 0 Z" fill="url(#${fill})"/>${vein}</g>`;
}

/**
 * Leaves in alternating pairs along a curved stem, leaning towards the tip and smaller near it.
 * Olive sprigs are slender and two-toned, ruscus leaves broad and dark.
 */
function leafyStem(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  bend: number,
  kind: 'olive' | 'ruscus',
  random: Random,
): string {
  const { at, tangent, d } = stem(x, y, length, angleDeg, bend);
  const olive = kind === 'olive';
  const count = Math.max(5, Math.round(length / (olive ? 26 : 32)));
  const leaves: string[] = [];
  const fruit: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = 0.1 + (0.86 * i) / (count - 1);
    const [px, py] = at(t);
    const [tx, ty] = tangent(t);
    const side = i % 2 === 0 ? 1 : -1;
    const direction = (Math.atan2(ty, tx) * 180) / Math.PI + side * (olive ? 38 : 44);
    const size = length * (olive ? 0.2 : 0.17) * (1 - 0.4 * t) * (0.85 + random() * 0.3);
    const fill = olive ? (i % 3 === 1 ? 'oliveSilver' : 'olive') : 'ruscus';
    leaves.push(leaf(px, py, size, direction, olive ? 0.15 : 0.3, fill));
    if (olive && i % 4 === 2) {
      const [ox, oy] = [px - ty * side * size * 0.25, py + tx * side * size * 0.25];
      fruit.push(
        `<ellipse cx="${r2(ox)}" cy="${r2(oy)}" rx="${r2(size * 0.16)}" ry="${r2(size * 0.12)}" fill="${i % 8 === 2 ? '#3e4630' : '#6f7c47'}"/>`,
      );
    }
  }
  const [endX, endY] = at(1);
  const [tx, ty] = tangent(1);
  leaves.push(
    leaf(
      endX,
      endY,
      length * (olive ? 0.14 : 0.12),
      (Math.atan2(ty, tx) * 180) / Math.PI,
      olive ? 0.15 : 0.3,
      olive ? 'olive' : 'ruscus',
    ),
  );
  const color = olive ? '#6c7a52' : '#4b6b4c';
  return `<g><path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>${leaves.join('')}${fruit.join('')}</g>`;
}

/** A eucalyptus stem: round, silvery leaves in alternating pairs, smaller towards the tip. */
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
    return `<ellipse cx="${r2(lx)}" cy="${r2(ly)}" rx="${r2(radius)}" ry="${r2(radius * 0.86)}" fill="url(#euca)" stroke="#86a092" stroke-width="1"/>`;
  });
  return `<g><path d="${d}" fill="none" stroke="#728a7c" stroke-width="2.4" stroke-linecap="round"/>${leaves.join('')}</g>`;
}

/**
 * Baby's breath: a thin stem that forks into sprays of tiny white flowers. Each spray is an opaque
 * pale cloud with the flowers drawn inside it: separate dots on transparency would make the alpha
 * channel (which the image optimizer keeps lossless) far heavier.
 */
function gypsophila(x: number, y: number, length: number, angleDeg: number, random: Random) {
  const main = stem(x, y, length, angleDeg, (random() - 0.5) * 0.2);
  const stems = [main.d];
  const clouds: string[] = [];
  const flowers: string[] = [];
  const cluster = (cx: number, cy: number, spread: number) => {
    clouds.push(
      `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(spread * 1.25)}"/><circle cx="${r2(cx + spread * 0.7)}" cy="${r2(cy - spread * 0.3)}" r="${r2(spread * 0.8)}"/><circle cx="${r2(cx - spread * 0.6)}" cy="${r2(cy + spread * 0.4)}" r="${r2(spread * 0.75)}"/>`,
    );
    const count = 6 + Math.floor(random() * 5);
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = spread * Math.sqrt(random());
      flowers.push(
        `<circle cx="${r2(cx + Math.cos(angle) * distance)}" cy="${r2(cy + Math.sin(angle) * distance)}" r="${r2(2.6 + random() * 1.8)}"/>`,
      );
    }
  };
  for (const t of [0.4, 0.55, 0.7, 0.85, 1]) {
    const [px, py] = main.at(t);
    const [tx, ty] = main.tangent(t);
    const base = Math.atan2(ty, tx);
    const forks = t === 1 ? [0] : [-1, 1].map((side) => side * radians(22 + random() * 28));
    for (const turn of forks) {
      const reach = length * 0.22 * (0.6 + random() * 0.4);
      const [ex, ey] = [px + Math.cos(base + turn) * reach, py + Math.sin(base + turn) * reach];
      stems.push(`M${r2(px)} ${r2(py)}L${r2(ex)} ${r2(ey)}`);
      cluster(ex, ey, length * 0.05);
    }
  }
  return `<g><path d="${stems.join('')}" fill="none" stroke="#8c9d7c" stroke-width="1.4" stroke-linecap="round"/><g fill="#dfe6d6" stroke="#c6d0bb" stroke-width="1">${clouds.join('')}</g><g fill="#ffffff">${flowers.join('')}</g></g>`;
}

interface Arrangement {
  /** x, y, radius, gradient */
  roses: [number, number, number, string][];
  /** x, y, length, angle, bend */
  ruscus: [number, number, number, number, number][];
  /** x, y, length, angle, bend, leaf radius */
  eucalyptus: [number, number, number, number, number, number][];
  /** x, y, length, angle, bend */
  olive: [number, number, number, number, number][];
  /** x, y, length, angle */
  gypsophila: [number, number, number, number][];
}

/** Back to front: ruscus, eucalyptus, olive, baby's breath, roses. */
function arrangement(layout: Arrangement, random: Random): string {
  return [
    ...layout.ruscus.map(([x, y, length, angle, bend]) =>
      leafyStem(x, y, length, angle, bend, 'ruscus', random),
    ),
    ...layout.eucalyptus.map(([x, y, length, angle, bend, leafRadius]) =>
      eucalyptus(x, y, length, angle, bend, leafRadius, random),
    ),
    ...layout.olive.map(([x, y, length, angle, bend]) =>
      leafyStem(x, y, length, angle, bend, 'olive', random),
    ),
    ...layout.gypsophila.map(([x, y, length, angle]) => gypsophila(x, y, length, angle, random)),
    ...layout.roses.map(([x, y, radius, fill]) => rose(x, y, radius, fill, random)),
  ].join('');
}

/** Corner clusters are anchored at the top-left corner; the garland runs along the top edge.
 * Laid out small, then scaled so the flowers fill most of the canvas. */
const LAYOUTS = {
  corner: {
    scale: 1.5,
    roses: [
      [150, 120, 78, 'roseWhite'],
      [290, 68, 54, 'roseCream'],
      [86, 266, 50, 'roseWhite'],
      [236, 206, 32, 'roseBlush'],
    ],
    ruscus: [
      [0, 20, 380, 18, 0.06],
      [0, 10, 320, 80, 0.05],
    ],
    eucalyptus: [
      [10, 10, 340, 36, 0.08, 16],
      [5, 5, 300, 66, -0.1, 15],
    ],
    olive: [
      [20, 0, 400, 6, -0.05],
      [0, 30, 320, 88, -0.04],
    ],
    gypsophila: [
      [120, 150, 200, 30],
      [100, 180, 170, 70],
      [200, 60, 170, 8],
    ],
  },
  cornerAlt: {
    scale: 1.5,
    roses: [
      [118, 150, 70, 'roseCream'],
      [262, 92, 52, 'roseWhite'],
      [70, 318, 44, 'roseWhite'],
      [210, 250, 30, 'roseBlush'],
    ],
    ruscus: [
      [0, 10, 400, 26, -0.05],
      [0, 0, 340, 70, 0.06],
    ],
    eucalyptus: [
      [5, 5, 320, 8, -0.08, 15],
      [5, 5, 320, 52, 0.08, 15],
    ],
    olive: [
      [0, 0, 410, 16, 0.05],
      [-10, 20, 360, 80, 0.06],
    ],
    gypsophila: [
      [150, 170, 190, 22],
      [110, 210, 180, 62],
    ],
  },
  garland: {
    scale: 1.3,
    roses: [
      [70, 110, 68, 'roseWhite'],
      [215, 70, 50, 'roseCream'],
      [360, 118, 62, 'roseWhite'],
      [520, 70, 44, 'roseBlush'],
      [650, 110, 40, 'roseWhite'],
    ],
    ruscus: [
      [300, 50, 480, 4, 0.04],
      [40, 120, 230, 76, -0.05],
      [560, 90, 260, 8, 0.05],
    ],
    eucalyptus: [
      [280, 70, 400, 6, -0.06, 15],
      [90, 100, 230, 60, 0.08, 14],
    ],
    olive: [
      [330, 40, 470, 2, 0.04],
      [200, 100, 260, 40, 0.06],
      [620, 100, 220, 14, 0.05],
    ],
    gypsophila: [
      [420, 120, 170, 20],
      [250, 150, 160, 50],
      [700, 110, 130, 10],
      [120, 160, 140, 70],
    ],
  },
} satisfies Record<string, Arrangement & { scale: number }>;

function floralSvg(width: number, height: number, seed: number, layout: keyof typeof LAYOUTS) {
  const { scale, ...parts } = LAYOUTS[layout];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${DEFS}</defs><g transform="scale(${scale})"><g filter="url(#watercolor)">${arrangement(parts, seeded(seed))}</g></g></svg>`;
}

/** Pale sage watercolour paper (half of the tile; paperTexture mirrors it to make it seamless). */
function paperSvg(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="washGreen" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0018 0.0044" numOctaves="3" seed="13" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.78  0 0 0 0 0.86  0 0 0 0 0.77  2.0 0 0 0 -0.92"/>
      </filter>
      <filter id="washLight" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0024 0.0058" numOctaves="3" seed="27" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.98  0 0 0 0 1  0 0 0 0 0.97  2.4 0 0 0 -1.05"/>
      </filter>
      <filter id="paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="6" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.48  0 0 0 0 0.56  0 0 0 0 0.48  0 0 0 0.08 0"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="#edf2e9"/>
    <rect width="100%" height="100%" filter="url(#washGreen)"/>
    <rect width="100%" height="100%" filter="url(#washLight)"/>
    <rect width="100%" height="100%" filter="url(#paper)"/>
  </svg>`;
}

/** A wooden pergola dressed with greenery and white roses on a lawn, with stepping stones and
 * hedges behind. No sky: the page's paper texture shows through above the garden. */
function heroSvg(width: number, height: number): string {
  const random = seeded(71);
  const [left, right, top, ground] = [340, 722, 312, 770];
  const posts = [left, right]
    .map(
      (x) =>
        `<rect x="${x}" y="${top}" width="18" height="${ground - top}" fill="url(#wood)" stroke="#8e7254" stroke-width="2"/><rect x="${x - 6}" y="${ground - 16}" width="30" height="18" rx="3" fill="#a58663"/>`,
    )
    .join('');
  const rafters = Array.from({ length: 7 }, (_, i) => 312 + i * 76)
    .map(
      (x) =>
        `<rect x="${x}" y="${top - 22}" width="14" height="26" rx="2" fill="url(#wood)" stroke="#8e7254" stroke-width="2"/>`,
    )
    .join('');
  // Greenery along the beam, trailing down the posts.
  const beamGreens: Arrangement = {
    roses: [],
    ruscus: [
      [360, 318, 200, 170, 0.06],
      [540, 312, 210, 178, -0.05],
      [540, 312, 200, 4, 0.05],
      [720, 318, 190, 10, -0.06],
      [350, 330, 250, 96, -0.08],
    ],
    eucalyptus: [
      [450, 314, 170, 196, 0.1, 12],
      [630, 314, 170, -16, -0.1, 12],
      [730, 330, 220, 86, 0.08, 12],
    ],
    olive: [
      [400, 316, 220, 150, -0.08],
      [680, 316, 220, 30, 0.08],
      [360, 326, 280, 82, 0.05],
      [724, 326, 240, 98, -0.06],
    ],
    gypsophila: [
      [400, 330, 110, 80],
      [680, 330, 110, 100],
    ],
  };
  const topLeft: Arrangement = {
    roses: [
      [352, 318, 46, 'roseWhite'],
      [400, 300, 34, 'roseCream'],
      [314, 352, 30, 'roseBlush'],
      [390, 348, 24, 'roseWhite'],
    ],
    ruscus: [],
    eucalyptus: [],
    olive: [],
    gypsophila: [
      [360, 320, 130, 210],
      [370, 320, 120, 300],
      [380, 330, 120, 40],
    ],
  };
  const topRight: Arrangement = {
    roses: [
      [726, 318, 38, 'roseWhite'],
      [686, 304, 26, 'roseCream'],
      [754, 348, 24, 'roseWhite'],
    ],
    ruscus: [],
    eucalyptus: [],
    olive: [],
    gypsophila: [
      [720, 320, 110, 320],
      [730, 330, 110, 20],
    ],
  };
  const floor = (x: number, mirror: 1 | -1): Arrangement => ({
    roses: [
      [x, 762, 40, 'roseWhite'],
      [x + 40 * mirror, 780, 30, 'roseCream'],
      [x - 36 * mirror, 780, 26, 'roseBlush'],
    ],
    ruscus: [
      [x, 770, 200, mirror === 1 ? -120 : -60, 0.05],
      [x, 776, 180, mirror === 1 ? 190 : -10, -0.05],
    ],
    eucalyptus: [[x, 774, 170, mirror === 1 ? -150 : -30, 0.08, 12]],
    olive: [
      [x, 770, 220, mirror === 1 ? -100 : -80, -0.05],
      [x, 776, 170, mirror === 1 ? 170 : 10, 0.06],
    ],
    gypsophila: [
      [x, 766, 120, -90 - 30 * mirror],
      [x, 766, 110, -90 + 20 * mirror],
    ],
  });
  const hedge = (x: number, y: number, widthPx: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const cx = x + (i / 4) * widthPx;
      const r = 34 + random() * 22;
      return `<circle cx="${r2(cx)}" cy="${r2(y - r * 0.4)}" r="${r2(r)}" fill="${i % 2 === 0 ? '#86a37e' : '#9ab592'}"/>`;
    }).join('');
  const stones = [
    [540, 872, 64, 15],
    [540, 832, 52, 12],
    [540, 800, 42, 9],
    [540, 776, 34, 7],
  ]
    .map(
      ([cx, cy, rx, ry]) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#dcdacb" stroke="#bbb8a5" stroke-width="2"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${DEFS}
      <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b3c6a3"/>
        <stop offset="45%" stop-color="#cfdcc4"/>
        <stop offset="100%" stop-color="#e6ede0"/>
      </linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#a88a67"/>
        <stop offset="50%" stop-color="#c7aa86"/>
        <stop offset="100%" stop-color="#a88a67"/>
      </linearGradient>
    </defs>
    <g filter="url(#watercolor)">
      ${hedge(40, 712, 250)}
      ${hedge(790, 712, 250)}
      <path d="M0 704 Q270 690 540 700 T1080 696 V900 H0 Z" fill="url(#lawn)"/>
      ${stones}
      ${rafters}
      ${posts}
      <rect x="296" y="${top}" width="488" height="24" rx="3" fill="url(#wood)" stroke="#8e7254" stroke-width="2"/>
      ${arrangement(beamGreens, random)}
      ${arrangement(floor(349, 1), random)}
      ${arrangement(floor(731, -1), random)}
      ${arrangement(topLeft, random)}
      ${arrangement(topRight, random)}
    </g>
  </svg>`;
}

export const jardimArtwork: readonly ArtworkFile[] = [
  paperTexture('background.webp', 1080, 1920, '#edf2e9', paperSvg),
  svgArtwork('floral-corner.webp', 640, 640, () => floralSvg(640, 640, 37, 'corner')),
  svgArtwork('floral-corner-alt.webp', 640, 640, () => floralSvg(640, 640, 47, 'cornerAlt')),
  svgArtwork('floral-garland.webp', 1080, 440, () => floralSvg(1080, 440, 59, 'garland')),
  svgArtwork('hero-pergola.webp', 1080, 900, () => heroSvg(1080, 900)),
];
