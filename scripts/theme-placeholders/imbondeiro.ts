/**
 * Placeholder artwork of "Imbondeiro": warm sand watercolour paper, king proteas with dried palm
 * fans, protea foliage and savanna grass, and a baobab (imbondeiro) against a low sun for the
 * hero pages (README → Themes → Artwork).
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
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="37" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="shifted"/>
    <feGaussianBlur in="shifted" stdDeviation="0.6"/>
  </filter>
  <linearGradient id="bractCoral" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#b24f35"/>
    <stop offset="60%" stop-color="#d9866a"/>
    <stop offset="100%" stop-color="#f1c3ad"/>
  </linearGradient>
  <linearGradient id="bractBlush" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#bf6f5e"/>
    <stop offset="60%" stop-color="#e3a795"/>
    <stop offset="100%" stop-color="#f7dacd"/>
  </linearGradient>
  <linearGradient id="bractRust" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#8f3f22"/>
    <stop offset="60%" stop-color="#bd6743"/>
    <stop offset="100%" stop-color="#e6a988"/>
  </linearGradient>
  <radialGradient id="proteaHeart" cx="45%" cy="40%" r="60%">
    <stop offset="0%" stop-color="#fbefe4"/>
    <stop offset="60%" stop-color="#f0d8c4"/>
    <stop offset="100%" stop-color="#d7ae92"/>
  </radialGradient>
  <linearGradient id="palm" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#d2b083"/>
    <stop offset="100%" stop-color="#eedbb8"/>
  </linearGradient>
  <linearGradient id="proteaLeaf" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#66703f"/>
    <stop offset="100%" stop-color="#a1a673"/>
  </linearGradient>
`;

/** A bract or leaf along +x from (x, y), turned by `angleDeg`; `width` is a share of the length. */
function blade(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  width: number,
  fill: string,
  edge: string,
): string {
  const w = length * width;
  return `<path transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(angleDeg)})" d="M0 0 C${r2(length * 0.25)} ${r2(-w)} ${r2(length * 0.78)} ${r2(-w * 0.75)} ${r2(length)} 0 C${r2(length * 0.78)} ${r2(w * 0.75)} ${r2(length * 0.25)} ${r2(w)} 0 0 Z" fill="url(#${fill})" stroke="${edge}" stroke-width="${r2(Math.max(1, length * 0.018))}"/>`;
}

/** A king protea seen from the front: two rings of pointed bracts around a pale, tufted dome. */
function protea(cx: number, cy: number, radius: number, fill: string, random: Random): string {
  const start = random() * 360;
  const outerCount = 13 + Math.floor(random() * 3);
  const outer = Array.from({ length: outerCount }, (_, i) =>
    blade(
      cx,
      cy,
      radius * (0.95 + random() * 0.15),
      start + (i / outerCount) * 360 + (random() - 0.5) * 8,
      0.3,
      fill,
      '#9a4a33',
    ),
  );
  const innerCount = 10;
  const inner = Array.from({ length: innerCount }, (_, i) =>
    blade(
      cx,
      cy,
      radius * (0.62 + random() * 0.08),
      start + ((i + 0.5) / innerCount) * 360,
      0.32,
      'bractBlush',
      '#b36a58',
    ),
  );
  const tufts = Array.from({ length: 22 }, (_, i) => {
    const angle = radians((i / 22) * 360 + random() * 6);
    const [r1, r2x] = [radius * 0.2, radius * (0.36 + random() * 0.05)];
    return `M${r2(cx + Math.cos(angle) * r1)} ${r2(cy + Math.sin(angle) * r1)}L${r2(cx + Math.cos(angle) * r2x)} ${r2(cy + Math.sin(angle) * r2x)}`;
  });
  const heart = `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(radius * 0.42)}" fill="url(#proteaHeart)" stroke="#c99b7f" stroke-width="${r2(radius * 0.025)}"/><path d="${tufts.join('')}" stroke="#d2ab91" stroke-width="${r2(Math.max(1, radius * 0.025))}" stroke-linecap="round"/><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(radius * 0.13)}" fill="#e8cdb6"/>`;
  return `<g>${outer.join('')}${inner.join('')}${heart}</g>`;
}

/**
 * A dried fan palm leaf: a stalk from (x, y), then a pleated fan opening towards `angleDeg` over
 * `spreadDeg`, with a jagged rim. Opaque, like the rest of the artwork.
 */
function palmFan(
  x: number,
  y: number,
  radius: number,
  angleDeg: number,
  spreadDeg: number,
  random: Random,
): string {
  const direction = radians(angleDeg);
  const base: Point = [
    x + Math.cos(direction) * radius * 0.3,
    y + Math.sin(direction) * radius * 0.3,
  ];
  const pleats = 17;
  const tips: Point[] = [];
  const outline: Point[] = [base];
  for (let i = 0; i < pleats; i += 1) {
    const angle = direction + radians(spreadDeg * (i / (pleats - 1) - 0.5));
    const reach = radius * (0.92 + random() * 0.1);
    const tip: Point = [base[0] + Math.cos(angle) * reach, base[1] + Math.sin(angle) * reach];
    tips.push(tip);
    outline.push(tip);
    if (i < pleats - 1) {
      const notch = angle + radians(spreadDeg / (pleats - 1) / 2);
      outline.push([
        base[0] + Math.cos(notch) * radius * 0.84,
        base[1] + Math.sin(notch) * radius * 0.84,
      ]);
    }
  }
  const shape = outline.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${r2(px)} ${r2(py)}`).join('');
  const folds = tips
    .map(([px, py]) => `M${r2(base[0])} ${r2(base[1])}L${r2(px)} ${r2(py)}`)
    .join('');
  return `<g><path d="M${r2(x)} ${r2(y)}L${r2(base[0])} ${r2(base[1])}" stroke="#b08a5a" stroke-width="${r2(radius * 0.03)}" stroke-linecap="round"/><path d="${shape}Z" fill="url(#palm)" stroke="#c7a676" stroke-width="1.5" stroke-linejoin="round"/><path d="${folds}" stroke="#bf9b69" stroke-width="1.6" stroke-linecap="round"/></g>`;
}

/** Savanna grass: a thin curved stem with a golden seed head along its last 40%. */
function grass(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  bend: number,
  random: Random,
): string {
  const { at, tangent, d } = stem(x, y, length, angleDeg, bend);
  const count = Math.round(length / 7);
  const grains = Array.from({ length: count }, (_, i) => {
    const t = 0.6 + (0.4 * i) / count;
    const [px, py] = at(t);
    const [tx, ty] = tangent(t);
    const side = i % 2 === 0 ? 1 : -1;
    const angle = (Math.atan2(ty, tx) * 180) / Math.PI + side * (22 + random() * 14);
    const size = Math.min(6, length * 0.018) * (1 - 0.5 * (t - 0.6));
    // Grains stand off the stem on alternating sides, leaning towards the tip.
    const [gx, gy] = [px - ty * side * size * 1.2, py + tx * side * size * 1.2];
    return `<ellipse cx="${r2(gx)}" cy="${r2(gy)}" rx="${r2(size * 1.8)}" ry="${r2(size * 0.6)}" transform="rotate(${r2(angle)} ${r2(gx)} ${r2(gy)})" fill="${i % 3 === 0 ? '#c89b55' : '#dcb676'}"/>`;
  });
  return `<g><path d="${d}" fill="none" stroke="#b08a50" stroke-width="1.7" stroke-linecap="round"/>${grains.join('')}</g>`;
}

/** Protea foliage: long leathery leaves along a stem, leaning towards the tip. */
function foliage(
  x: number,
  y: number,
  length: number,
  angleDeg: number,
  bend: number,
  random: Random,
): string {
  const { at, tangent, d } = stem(x, y, length, angleDeg, bend);
  const count = Math.max(4, Math.round(length / 34));
  const leaves = Array.from({ length: count }, (_, i) => {
    const t = 0.15 + (0.8 * i) / (count - 1);
    const [px, py] = at(t);
    const [tx, ty] = tangent(t);
    const side = i % 2 === 0 ? 1 : -1;
    const angle = (Math.atan2(ty, tx) * 180) / Math.PI + side * (28 + random() * 10);
    return blade(px, py, length * 0.24 * (1 - 0.3 * t), angle, 0.2, 'proteaLeaf', '#5a6338');
  });
  return `<g><path d="${d}" fill="none" stroke="#6b6a3d" stroke-width="2.4" stroke-linecap="round"/>${leaves.join('')}</g>`;
}

interface Arrangement {
  /** x, y, radius, gradient */
  proteas: [number, number, number, string][];
  /** x, y, radius, angle, spread */
  palms: [number, number, number, number, number][];
  /** x, y, length, angle, bend */
  foliage: [number, number, number, number, number][];
  /** x, y, length, angle, bend */
  grass: [number, number, number, number, number][];
}

/** Back to front: palm fans, foliage, grass, proteas. */
function arrangement(layout: Arrangement, random: Random): string {
  return [
    ...layout.palms.map(([x, y, radius, angle, spread]) =>
      palmFan(x, y, radius, angle, spread, random),
    ),
    ...layout.foliage.map(([x, y, length, angle, bend]) =>
      foliage(x, y, length, angle, bend, random),
    ),
    ...layout.grass.map(([x, y, length, angle, bend]) => grass(x, y, length, angle, bend, random)),
    ...layout.proteas.map(([x, y, radius, fill]) => protea(x, y, radius, fill, random)),
  ].join('');
}

/** Corner clusters are anchored at the top-left corner; the garland runs along the top edge.
 * Laid out small, then scaled so the flowers fill most of the canvas. */
const LAYOUTS = {
  corner: {
    scale: 1.5,
    proteas: [
      [150, 120, 76, 'bractCoral'],
      [290, 66, 50, 'bractBlush'],
      [84, 268, 46, 'bractRust'],
      [238, 212, 30, 'bractBlush'],
    ],
    palms: [
      [0, 0, 250, 28, 120],
      [0, 20, 200, 72, 110],
    ],
    foliage: [
      [10, 10, 320, 18, 0.08],
      [10, 10, 300, 66, -0.1],
    ],
    grass: [
      [0, 20, 400, 12, 0.06],
      [10, 0, 380, 40, -0.05],
      [20, -10, 360, 58, 0.05],
      [0, 30, 340, 86, -0.05],
    ],
  },
  cornerAlt: {
    scale: 1.5,
    proteas: [
      [118, 150, 68, 'bractBlush'],
      [262, 92, 50, 'bractCoral'],
      [70, 318, 42, 'bractCoral'],
      [210, 250, 28, 'bractRust'],
    ],
    palms: [[0, 0, 240, 46, 130]],
    foliage: [
      [5, 5, 320, 8, -0.08],
      [5, 5, 320, 56, 0.08],
    ],
    grass: [
      [0, 10, 420, 22, 0.05],
      [0, 0, 380, 50, -0.06],
      [-10, 20, 360, 78, 0.06],
    ],
  },
  garland: {
    scale: 1.3,
    proteas: [
      [70, 110, 64, 'bractCoral'],
      [215, 70, 48, 'bractBlush'],
      [360, 118, 58, 'bractRust'],
      [520, 70, 42, 'bractCoral'],
      [650, 110, 36, 'bractBlush'],
    ],
    palms: [
      [140, 30, 200, 16, 120],
      [440, 30, 190, -8, 120],
    ],
    foliage: [
      [280, 70, 400, 6, -0.06],
      [90, 100, 230, 60, 0.08],
      [560, 80, 250, 10, 0.06],
    ],
    grass: [
      [330, 40, 480, 3, 0.04],
      [500, 60, 330, -4, -0.05],
      [200, 100, 260, 40, 0.06],
      [620, 100, 220, 14, 0.05],
    ],
  },
} satisfies Record<string, Arrangement & { scale: number }>;

function floralSvg(width: number, height: number, seed: number, layout: keyof typeof LAYOUTS) {
  const { scale, ...parts } = LAYOUTS[layout];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${DEFS}</defs><g transform="scale(${scale})"><g filter="url(#watercolor)">${arrangement(parts, seeded(seed))}</g></g></svg>`;
}

/** Warm sand watercolour paper (half of the tile; paperTexture mirrors it to make it seamless). */
function paperSvg(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="washWarm" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0018 0.0042" numOctaves="3" seed="31" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.79  0 0 0 0 0.64  1.9 0 0 0 -0.9"/>
      </filter>
      <filter id="washLight" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0024 0.0058" numOctaves="3" seed="12" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.94  2.4 0 0 0 -1.05"/>
      </filter>
      <filter id="paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="15" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.47  0 0 0 0 0.34  0 0 0 0.08 0"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="#f6ebdc"/>
    <rect width="100%" height="100%" filter="url(#washWarm)"/>
    <rect width="100%" height="100%" filter="url(#washLight)"/>
    <rect width="100%" height="100%" filter="url(#paper)"/>
  </svg>`;
}

/** A thick, tapering branch through `points`, drawn as strokes that thin towards the tip. */
function branch(points: readonly Point[], width: number): string {
  return points
    .slice(1)
    .map(([x, y], i) => {
      const [px, py] = points[i] ?? [x, y];
      const w = width * (1 - i / points.length);
      return `<path d="M${r2(px)} ${r2(py)}L${r2(x)} ${r2(y)}" stroke="#5e3f30" stroke-width="${r2(w)}" stroke-linecap="round"/>`;
    })
    .join('');
}

/** A baobab against a low sun over the savanna, with distant acacias, birds and proteas in the
 * foreground. No sky: the page's paper texture shows through above the sun. */
function heroSvg(width: number, height: number): string {
  const random = seeded(83);
  const branches: [readonly Point[], number][] = [
    [
      [
        [508, 458],
        [430, 356],
        [366, 322],
      ],
      24,
    ],
    [
      [
        [430, 356],
        [404, 300],
      ],
      11,
    ],
    [
      [
        [524, 452],
        [488, 342],
        [476, 288],
      ],
      20,
    ],
    [
      [
        [540, 450],
        [546, 334],
        [532, 276],
      ],
      20,
    ],
    [
      [
        [546, 334],
        [578, 294],
      ],
      10,
    ],
    [
      [
        [556, 452],
        [608, 344],
        [640, 298],
      ],
      20,
    ],
    [
      [
        [572, 458],
        [656, 360],
        [722, 330],
      ],
      24,
    ],
    [
      [
        [656, 360],
        [684, 312],
      ],
      11,
    ],
    [
      [
        [504, 470],
        [412, 414],
        [352, 404],
      ],
      18,
    ],
    [
      [
        [578, 470],
        [668, 420],
        [730, 414],
      ],
      18,
    ],
  ];
  const tips: Point[] = [
    [366, 322],
    [404, 300],
    [476, 288],
    [532, 276],
    [578, 294],
    [640, 298],
    [722, 330],
    [684, 312],
    [352, 404],
    [730, 414],
  ];
  const leaves = tips
    .flatMap(([x, y]) =>
      Array.from({ length: 4 }, () => {
        const [lx, ly] = [x + (random() - 0.5) * 44, y + (random() - 0.5) * 26];
        return `<ellipse cx="${r2(lx)}" cy="${r2(ly)}" rx="${r2(10 + random() * 8)}" ry="${r2(7 + random() * 5)}" fill="${random() > 0.5 ? '#6d7443' : '#8a8f55'}"/>`;
      }),
    )
    .join('');
  const acacia = (x: number, y: number, scale: number) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0 L-4 -46 M-4 -30 L-26 -50 M-2 -38 L20 -54" stroke="#7c5c40" stroke-width="5" stroke-linecap="round"/><ellipse cx="-6" cy="-58" rx="62" ry="13" fill="#7f6a43"/><ellipse cx="18" cy="-66" rx="36" ry="9" fill="#8d7750"/></g>`;
  const birds = [
    [300, 330, 1],
    [346, 302, 0.8],
    [772, 356, 0.9],
  ]
    .map(
      ([x, y, s]) =>
        `<path transform="translate(${x} ${y}) scale(${s})" d="M-18 0 Q-9 -10 0 0 Q9 -10 18 0" fill="none" stroke="#7a5140" stroke-width="3.5" stroke-linecap="round"/>`,
    )
    .join('');
  const tufts = Array.from({ length: 36 }, (_, i) => {
    const x = (i / 35) * 1080 + (random() - 0.5) * 20;
    const y = 712 + random() * 40;
    const lean = (random() - 0.5) * 40;
    return `M${r2(x)} ${r2(y)}l${r2(lean * 0.4 - 6)} ${r2(-14 - random() * 16)}M${r2(x)} ${r2(y)}l${r2(lean * 0.4)} ${r2(-20 - random() * 18)}M${r2(x)} ${r2(y)}l${r2(lean * 0.4 + 7)} ${r2(-12 - random() * 14)}`;
  }).join('');
  const floor = (x: number, mirror: 1 | -1): Arrangement => ({
    proteas: [
      [x, 842, 58, 'bractCoral'],
      [x + 70 * mirror, 870, 40, 'bractBlush'],
      [x - 58 * mirror, 874, 34, 'bractRust'],
    ],
    palms: [[x, 860, 190, mirror === 1 ? -70 : -110, 120]],
    foliage: [
      [x, 852, 200, mirror === 1 ? -30 : -150, 0.06],
      [x, 852, 180, mirror === 1 ? -120 : -60, -0.06],
    ],
    grass: [
      [x, 850, 260, mirror === 1 ? -84 : -96, 0.05],
      [x, 850, 230, mirror === 1 ? -54 : -126, -0.05],
      [x, 850, 220, mirror === 1 ? -112 : -68, 0.04],
    ],
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${DEFS}
      <radialGradient id="sun" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#f8cf9f"/>
        <stop offset="60%" stop-color="#f0a672"/>
        <stop offset="100%" stop-color="#e58a5c"/>
      </radialGradient>
      <linearGradient id="savanna" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d7a765"/>
        <stop offset="40%" stop-color="#e7c690"/>
        <stop offset="100%" stop-color="#f3e3c9"/>
      </linearGradient>
      <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#553829"/>
        <stop offset="35%" stop-color="#7d5644"/>
        <stop offset="100%" stop-color="#553829"/>
      </linearGradient>
    </defs>
    <g filter="url(#watercolor)">
      <circle cx="540" cy="560" r="214" fill="url(#sun)"/>
      ${birds}
      ${acacia(318, 706, 0.75)}
      ${acacia(790, 708, 0.6)}
      <path d="M0 708 Q270 694 540 704 T1080 700 V900 H0 Z" fill="url(#savanna)"/>
      <path d="${tufts}" stroke="#b58d52" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M440 778 C424 720 416 660 430 600 C444 540 470 492 496 452 C522 440 560 440 586 452 C612 492 638 540 652 600 C664 660 656 720 640 778 Q540 796 440 778 Z" fill="url(#trunk)" stroke="#4a3124" stroke-width="3"/>
      <path d="M470 520 C448 590 446 680 462 770 M540 470 C534 580 540 680 536 786 M612 520 C634 590 636 680 620 772" fill="none" stroke="#4d3326" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round"/>
      ${branches.map(([points, w]) => branch(points, w)).join('')}
      ${leaves}
      ${arrangement(floor(150, 1), random)}
      ${arrangement(floor(930, -1), random)}
    </g>
  </svg>`;
}

export const imbondeiroArtwork: readonly ArtworkFile[] = [
  paperTexture('background.webp', 1080, 1920, '#f6ebdc', paperSvg),
  svgArtwork('floral-corner.webp', 640, 640, () => floralSvg(640, 640, 67, 'corner')),
  svgArtwork('floral-corner-alt.webp', 640, 640, () => floralSvg(640, 640, 73, 'cornerAlt')),
  svgArtwork('floral-garland.webp', 1080, 440, () => floralSvg(1080, 440, 79, 'garland')),
  svgArtwork('hero-baobab.webp', 1080, 900, () => heroSvg(1080, 900)),
];
