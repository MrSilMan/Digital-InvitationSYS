/**
 * Placeholder artwork of "Praia Rosa": pale sky-blue watercolour paper, pink rose clusters and a
 * beach wedding scene, in the positions and style of the reference (README → Themes → Artwork).
 */
import { paperTexture, r2, seeded, svgArtwork, type ArtworkFile, type Random } from './shared';

// ── Shared SVG definitions: watercolour edges, rose and leaf gradients ─────────────────────────

const DEFS = `
  <filter id="watercolor" x="-25%" y="-25%" width="150%" height="150%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="shifted"/>
    <feGaussianBlur in="shifted" stdDeviation="0.7"/>
  </filter>
  <radialGradient id="rosePink" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#b3375f"/>
    <stop offset="38%" stop-color="#d65d86"/>
    <stop offset="75%" stop-color="#eea0b8"/>
    <stop offset="100%" stop-color="#f8cfdb"/>
  </radialGradient>
  <radialGradient id="roseBlush" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#d9738f"/>
    <stop offset="45%" stop-color="#f0aabd"/>
    <stop offset="100%" stop-color="#fbe2e8"/>
  </radialGradient>
  <radialGradient id="roseCream" cx="45%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#e8b9a8"/>
    <stop offset="50%" stop-color="#f7e0d3"/>
    <stop offset="100%" stop-color="#fdf5ef"/>
  </radialGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#5f7a44"/>
    <stop offset="100%" stop-color="#a9bb82"/>
  </linearGradient>
  <linearGradient id="leafLight" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#7f9760"/>
    <stop offset="100%" stop-color="#c3d0a3"/>
  </linearGradient>
`;

function rose(cx: number, cy: number, radius: number, fill: string, random: Random): string {
  const turns = [0.82, 0.58, 0.34].map((scale, i) => {
    const rr = radius * scale;
    const start = random() * Math.PI * 2;
    const sweep = Math.PI * (1.1 + random() * 0.5);
    const x1 = cx + rr * Math.cos(start);
    const y1 = cy + rr * Math.sin(start);
    const x2 = cx + rr * Math.cos(start + sweep);
    const y2 = cy + rr * Math.sin(start + sweep);
    const width = r2(radius * (0.07 - i * 0.012));
    return `<path d="M${r2(x1)} ${r2(y1)} A${r2(rr)} ${r2(rr)} 0 0 1 ${r2(x2)} ${r2(y2)}" fill="none" stroke="#9b2f55" stroke-opacity="0.55" stroke-width="${width}" stroke-linecap="round"/>`;
  });
  return `<g><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(radius)}" fill="url(#${fill})" fill-opacity="0.95"/>${turns.join('')}<circle cx="${r2(cx - radius * 0.28)}" cy="${r2(cy - radius * 0.3)}" r="${r2(radius * 0.22)}" fill="#ffffff" fill-opacity="0.18"/></g>`;
}

function leaf(x: number, y: number, length: number, angleDeg: number, fill = 'leaf'): string {
  const w = length * 0.34;
  return `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(angleDeg)})"><path d="M0 0 C${r2(length * 0.3)} ${r2(-w)} ${r2(length * 0.72)} ${r2(-w)} ${r2(length)} 0 C${r2(length * 0.72)} ${r2(w)} ${r2(length * 0.3)} ${r2(w)} 0 0 Z" fill="url(#${fill})" fill-opacity="0.92"/><path d="M${r2(length * 0.06)} 0 L${r2(length * 0.9)} 0" stroke="#4d6536" stroke-opacity="0.45" stroke-width="${r2(Math.max(1, length * 0.025))}"/></g>`;
}

function sprig(points: [number, number][], berries: number, random: Random): string {
  const d = points
    .map(([px, py], i) => `${i === 0 ? 'M' : i === 1 ? 'Q' : ''}${r2(px)} ${r2(py)}`)
    .join(' ');
  const [end] = points.slice(-1);
  const dots = Array.from({ length: berries }, (_, i) => {
    const t = (i + 1) / (berries + 1);
    const [ax, ay] = points[0] ?? [0, 0];
    const [bx, by] = end ?? [0, 0];
    const bx2 = ax + (bx - ax) * t + (random() - 0.5) * 26;
    const by2 = ay + (by - ay) * t + (random() - 0.5) * 26;
    return `<circle cx="${r2(bx2)}" cy="${r2(by2)}" r="${r2(4 + random() * 4)}" fill="#c9416e" fill-opacity="0.85"/>`;
  });
  return `<path d="${d}" fill="none" stroke="#6b8550" stroke-width="3" stroke-linecap="round"/>${dots.join('')}`;
}

/** A cluster of roses, leaves and berry sprigs anchored at the top-left corner. */
function floralCluster(random: Random, layout: 'corner' | 'cornerAlt' | 'garland'): string {
  const parts: string[] = [];
  const roses: [number, number, number, string][] =
    layout === 'corner'
      ? [
          [150, 120, 80, 'rosePink'],
          [292, 66, 56, 'roseBlush'],
          [84, 268, 50, 'rosePink'],
          [240, 210, 34, 'roseCream'],
        ]
      : layout === 'cornerAlt'
        ? [
            [118, 150, 72, 'roseBlush'],
            [262, 92, 52, 'rosePink'],
            [70, 318, 44, 'roseCream'],
            [210, 250, 30, 'rosePink'],
          ]
        : [
            [70, 110, 70, 'rosePink'],
            [215, 70, 52, 'roseBlush'],
            [360, 118, 64, 'rosePink'],
            [520, 70, 46, 'roseCream'],
            [650, 110, 40, 'rosePink'],
          ];

  // Leaves first (behind the flowers), fanning outwards from each rose.
  for (const [cx, cy, radius] of roses) {
    const count = 4 + Math.floor(random() * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = -40 + (i / count) * 200 + random() * 25;
      const distance = radius * (0.55 + random() * 0.25);
      const x = cx + Math.cos((angle * Math.PI) / 180) * distance;
      const y = cy + Math.sin((angle * Math.PI) / 180) * distance;
      parts.push(
        leaf(x, y, radius * (0.9 + random() * 0.5), angle, random() > 0.5 ? 'leaf' : 'leafLight'),
      );
    }
  }

  const sprigs: [number, number][][] =
    layout === 'garland'
      ? [
          [
            [620, 60],
            [720, 40],
            [860, 70],
          ],
          [
            [300, 150],
            [330, 250],
            [300, 330],
          ],
          [
            [120, 170],
            [150, 260],
            [110, 360],
          ],
          [
            [520, 120],
            [560, 200],
            [620, 250],
          ],
        ]
      : [
          [
            [300, 60],
            [390, 30],
            [520, 48],
          ],
          [
            [230, 190],
            [330, 240],
            [440, 230],
          ],
          [
            [80, 300],
            [60, 400],
            [90, 520],
          ],
          [
            [200, 250],
            [230, 340],
            [210, 430],
          ],
        ];
  for (const points of sprigs) parts.push(sprig(points, 4 + Math.floor(random() * 3), random));

  for (const [cx, cy, radius, fill] of roses) parts.push(rose(cx, cy, radius, fill, random));

  // Scattered buds.
  for (let i = 0; i < 6; i += 1) {
    const [cx, cy, radius] = roses[i % roses.length] ?? [0, 0, 0];
    const angle = random() * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius * 1.6;
    const y = cy + Math.sin(angle) * radius * 1.6;
    if (x > 0 && y > 0) {
      parts.push(
        `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(radius * 0.18)}" ry="${r2(radius * 0.24)}" fill="#d95c91" fill-opacity="0.9"/>`,
      );
    }
  }

  return `<g filter="url(#watercolor)">${parts.join('')}</g>`;
}

function floralSvg(
  width: number,
  height: number,
  seed: number,
  layout: 'corner' | 'cornerAlt' | 'garland',
) {
  // Clusters are laid out small; scale them so the flowers fill most of the canvas.
  const scale = layout === 'garland' ? 1.3 : 1.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${DEFS}</defs><g transform="scale(${scale})">${floralCluster(seeded(seed), layout)}</g></svg>`;
}

/** Pale sky-blue watercolour paper (half of the tile; paperTexture mirrors it to make it seamless). */
function backgroundSvg(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="washBlue" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0019 0.0046" numOctaves="3" seed="5" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.70  0 0 0 0 0.86  0 0 0 0 0.92  2.2 0 0 0 -0.95"/>
      </filter>
      <filter id="washWhite" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.006" numOctaves="3" seed="9" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -1.05"/>
      </filter>
      <filter id="paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.7  0 0 0 0 0.76  0 0 0 0.09 0"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="#e9f3f6"/>
    <rect width="100%" height="100%" filter="url(#washBlue)"/>
    <rect width="100%" height="100%" filter="url(#washWhite)"/>
    <rect width="100%" height="100%" filter="url(#paper)"/>
  </svg>`;
}

/** Beach wedding scene for the bottom of hero pages: arch, sea and sand. No sky: the page's
 * paper texture shows through above the sea. */
function heroSvg(width: number, height: number): string {
  const random = seeded(42);
  const archTop = 250;
  const posts = [310, 770];
  const flowers = posts
    .map((x, i) =>
      [
        rose(x + (i === 0 ? 10 : -10), archTop + 10, 38, 'rosePink', random),
        rose(x + (i === 0 ? 48 : -48), archTop + 40, 26, 'roseCream', random),
        leaf(x, archTop + 30, 60, i === 0 ? 150 : 30),
        leaf(x, archTop + 50, 52, i === 0 ? 200 : -20, 'leafLight'),
      ].join(''),
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${DEFS}
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6fb9d0"/>
        <stop offset="100%" stop-color="#b6e2ec"/>
      </linearGradient>
      <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f3e6cd"/>
        <stop offset="100%" stop-color="#e3cca5"/>
      </linearGradient>
      <linearGradient id="drape" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.55"/>
      </linearGradient>
    </defs>
    <g filter="url(#watercolor)">
      <path d="M0 470 Q270 455 540 468 T1080 462 V640 H0 Z" fill="url(#sea)"/>
      <path d="M0 540 Q200 530 380 548 T760 544 T1080 552" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="5"/>
      <path d="M0 590 Q260 575 520 596 T1080 588" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="7"/>
      <path d="M0 610 Q280 590 560 612 T1080 606 V900 H0 Z" fill="url(#sand)"/>
      <path d="M470 900 Q520 760 540 640 Q560 760 610 900 Z" fill="#fbf4e6" fill-opacity="0.8"/>
      <rect x="${posts[0]}" y="${archTop}" width="14" height="470" rx="5" fill="#cdb18a"/>
      <rect x="${posts[1]}" y="${archTop}" width="14" height="470" rx="5" fill="#cdb18a"/>
      <path d="M${posts[0]} ${archTop} Q540 ${archTop - 40} ${(posts[1] ?? 0) + 14} ${archTop}" fill="none" stroke="#cdb18a" stroke-width="12"/>
      <path d="M${(posts[0] ?? 0) + 10} ${archTop + 8} C${(posts[0] ?? 0) - 40} ${archTop + 160} ${(posts[0] ?? 0) - 20} ${archTop + 330} ${(posts[0] ?? 0) - 70} ${archTop + 460} L${(posts[0] ?? 0) + 30} ${archTop + 460} C${(posts[0] ?? 0) + 30} ${archTop + 300} ${(posts[0] ?? 0) + 40} ${archTop + 150} ${(posts[0] ?? 0) + 10} ${archTop + 8} Z" fill="url(#drape)"/>
      <path d="M${(posts[1] ?? 0) + 4} ${archTop + 8} C${(posts[1] ?? 0) + 54} ${archTop + 160} ${(posts[1] ?? 0) + 34} ${archTop + 330} ${(posts[1] ?? 0) + 84} ${archTop + 460} L${(posts[1] ?? 0) - 16} ${archTop + 460} C${(posts[1] ?? 0) - 16} ${archTop + 300} ${(posts[1] ?? 0) - 26} ${archTop + 150} ${(posts[1] ?? 0) + 4} ${archTop + 8} Z" fill="url(#drape)"/>
      ${flowers}
    </g>
  </svg>`;
}

export const praiaRosaArtwork: readonly ArtworkFile[] = [
  paperTexture('background.webp', 1080, 1920, '#e9f3f6', backgroundSvg),
  svgArtwork('floral-corner.webp', 640, 640, () => floralSvg(640, 640, 7, 'corner')),
  svgArtwork('floral-corner-alt.webp', 640, 640, () => floralSvg(640, 640, 19, 'cornerAlt')),
  svgArtwork('floral-garland.webp', 1080, 440, () => floralSvg(1080, 440, 23, 'garland')),
  svgArtwork('hero-beach.webp', 1080, 900, () => heroSvg(1080, 900)),
];
