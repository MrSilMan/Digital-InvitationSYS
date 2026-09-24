/**
 * Draws the demo event's placeholder media into public/demo/:
 * - gallery/foto-1…6.webp: 1200×1500 "photos" (soft gradients with a white line motif), clearly
 *   placeholders until the couple uploads real photos (Phase 7);
 * - musica.wav: a 20-second synthesized piano-like loop, so the opening screen's music and the
 *   mute button can be tried. Replace it with licensed music for real events.
 *
 *   npm run demo:media              # writes missing files only
 *   npm run demo:media -- --force   # redraws them all
 *
 * Deterministic: every run produces the same files.
 */
import { access, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const OUT_DIR = path.join(process.cwd(), 'public', 'demo');
const FORCE = process.argv.includes('--force');

async function shouldWrite(file: string): Promise<boolean> {
  if (FORCE) return true;
  try {
    await access(path.join(OUT_DIR, file));
  } catch {
    return true;
  }
  console.log(`${file.padEnd(22)} kept (already exists; --force redraws it)`);
  return false;
}

async function report(file: string): Promise<void> {
  const { size } = await stat(path.join(OUT_DIR, file));
  console.log(`${file.padEnd(22)} ${Math.round(size / 1024)} KB`);
}

// ── Gallery placeholders ────────────────────────────────────────────────────────────────────────

/** White line motifs, drawn in a 200×200 box. */
const MOTIFS: Record<string, string> = {
  palm: `
    <path d="M100 172 C104 140 98 112 108 82"/>
    <path d="M108 82 C82 62 58 70 44 88"/><path d="M108 82 C130 58 158 62 170 80"/>
    <path d="M108 82 C100 54 82 42 60 46"/><path d="M108 82 C124 48 148 40 162 48"/>
    <path d="M52 174 Q100 160 152 174"/>`,
  rings: `
    <circle cx="80" cy="112" r="42"/><circle cx="122" cy="112" r="42"/>
    <path d="M80 70 L70 56 L90 56 Z"/>`,
  shell: `
    <path d="M100 162 L48 92 Q100 26 152 92 Z"/>
    <path d="M100 162 L72 64"/><path d="M100 162 L100 52"/><path d="M100 162 L128 64"/>
    <path d="M100 162 L56 82"/><path d="M100 162 L144 82"/>`,
  heart: `
    <path d="M100 160 C30 112 40 52 80 56 C92 58 100 68 100 76 C100 68 108 58 120 56 C160 52 170 112 100 160 Z"/>`,
  camera: `
    <rect x="42" y="70" width="116" height="84" rx="14"/><circle cx="100" cy="112" r="26"/>
    <path d="M76 70 L86 54 L114 54 L124 70"/><circle cx="140" cy="88" r="4"/>`,
  flower: `
    <circle cx="100" cy="86" r="12"/>
    <ellipse cx="100" cy="58" rx="14" ry="20"/><ellipse cx="100" cy="114" rx="14" ry="20"/>
    <ellipse cx="72" cy="86" rx="20" ry="14"/><ellipse cx="128" cy="86" rx="20" ry="14"/>
    <path d="M100 134 C98 150 102 162 100 178"/><path d="M100 160 C88 150 76 152 70 158"/>`,
};

const PHOTOS = [
  { motif: 'palm', top: '#cfe6f1', bottom: '#f3e3cc', blob: '#ffffff' },
  { motif: 'rings', top: '#f6d3dc', bottom: '#fbe7d6', blob: '#fff4f6' },
  { motif: 'shell', top: '#a9d4d9', bottom: '#e5f3f1', blob: '#ffffff' },
  { motif: 'heart', top: '#e3d9f0', bottom: '#f7dbe6', blob: '#fff8fb' },
  { motif: 'camera', top: '#f6e1c7', bottom: '#f1c2b5', blob: '#fffaf3' },
  { motif: 'flower', top: '#d6e4cf', bottom: '#f4efe2', blob: '#ffffff' },
] as const;

function photoSvg(
  width: number,
  height: number,
  photo: (typeof PHOTOS)[number],
  seed: number,
): string {
  const blobs = Array.from({ length: 5 }, (_, index) => {
    const x = ((seed * 37 + index * 211) % 100) / 100;
    const y = ((seed * 53 + index * 157) % 100) / 100;
    const r = 180 + ((seed * 29 + index * 71) % 160);
    return `<circle cx="${Math.round(x * width)}" cy="${Math.round(y * height)}" r="${r}" fill="${photo.blob}" fill-opacity="0.35"/>`;
  }).join('');
  const motifSize = width * 0.42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="${photo.top}"/><stop offset="100%" stop-color="${photo.bottom}"/>
      </linearGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="60"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g filter="url(#soft)">${blobs}</g>
    <g transform="translate(${(width - motifSize) / 2} ${(height - motifSize) / 2}) scale(${motifSize / 200})"
       fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.95">
      ${MOTIFS[photo.motif]}
    </g>
  </svg>`;
}

async function writeGallery(): Promise<void> {
  await mkdir(path.join(OUT_DIR, 'gallery'), { recursive: true });
  for (const [index, photo] of PHOTOS.entries()) {
    const file = `gallery/foto-${index + 1}.webp`;
    if (!(await shouldWrite(file))) continue;
    await sharp(Buffer.from(photoSvg(1200, 1500, photo, index + 3)))
      .webp({ quality: 78, effort: 6 })
      .toFile(path.join(OUT_DIR, file));
    await report(file);
  }
}

// ── Music placeholder ───────────────────────────────────────────────────────────────────────────

const SAMPLE_RATE = 11_025;
const BEAT = 0.3125; // eighth notes at 96 BPM
const NOTE: Record<string, number> = {
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  C3: 130.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  B4: 493.88,
};
/** Cmaj7 – Am7 – Fmaj7 – G6, twice: bass note, then four chord tones for the arpeggio. */
const CHORDS: [string, string[]][] = [
  ['C3', ['C4', 'E4', 'G4', 'B4']],
  ['A2', ['A3', 'C4', 'E4', 'G4']],
  ['F2', ['F3', 'A3', 'C4', 'E4']],
  ['G2', ['G3', 'B3', 'D4', 'E4']],
];
const PATTERN = [0, 1, 2, 3, 2, 1, 2, 3];

function pianoNote(
  samples: Float32Array,
  start: number,
  frequency: number,
  gain: number,
  decay: number,
) {
  const first = Math.round(start * SAMPLE_RATE);
  const length = Math.min(samples.length - first, Math.round(decay * 4 * SAMPLE_RATE));
  for (let index = 0; index < length; index += 1) {
    const t = index / SAMPLE_RATE;
    const envelope = Math.min(1, t / 0.008) * Math.exp(-t / decay);
    const phase = 2 * Math.PI * frequency * t;
    samples[first + index]! +=
      gain * envelope * (Math.sin(phase) + 0.3 * Math.sin(2 * phase) + 0.08 * Math.sin(3 * phase));
  }
}

function synthesize(): Float32Array {
  const chordLength = PATTERN.length * BEAT;
  const duration = chordLength * CHORDS.length * 2;
  const samples = new Float32Array(Math.round(duration * SAMPLE_RATE));
  for (let round = 0; round < 2; round += 1) {
    for (const [chordIndex, [bass, tones]] of CHORDS.entries()) {
      const start = (round * CHORDS.length + chordIndex) * chordLength;
      pianoNote(samples, start, NOTE[bass]!, 0.45, 1.6);
      for (const [step, toneIndex] of PATTERN.entries()) {
        pianoNote(samples, start + step * BEAT, NOTE[tones[toneIndex]!]!, 0.22, 0.9);
      }
    }
  }
  // Normalize to -4 dBFS and fade the loop edges (50 ms) so it repeats without a click.
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
  const fade = Math.round(0.05 * SAMPLE_RATE);
  for (let index = 0; index < samples.length; index += 1) {
    const edge = Math.min(1, index / fade, (samples.length - 1 - index) / fade);
    samples[index] = (samples[index]! / peak) * 0.63 * edge;
  }
  return samples;
}

function wav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((value, index) => data.writeInt16LE(Math.round(value * 32_767), index * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

async function writeMusic(): Promise<void> {
  const file = 'musica.wav';
  if (!(await shouldWrite(file))) return;
  await writeFile(path.join(OUT_DIR, file), wav(synthesize()));
  await report(file);
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  await writeGallery();
  await writeMusic();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
