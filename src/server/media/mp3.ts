/**
 * MP3 check for uploaded music. The browser's Content-Type is only a claim: the worker looks for
 * real MPEG audio (Layer III) frames, several in a row, and keeps just the audio. Leading ID3v2
 * and trailing ID3v1 tags go (cover art, comments): guests download less, nothing personal rides
 * along.
 */

/** kbit/s by bitrate index: MPEG-1 Layer III, then MPEG-2/2.5 Layer III. */
const BITRATES_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATES_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
/** Hz by sample-rate index, per version bits (0 = MPEG-2.5, 2 = MPEG-2, 3 = MPEG-1). */
const SAMPLE_RATES: Record<number, readonly number[]> = {
  0: [11_025, 12_000, 8_000],
  2: [22_050, 24_000, 16_000],
  3: [44_100, 48_000, 32_000],
};

/** How far after the tags the first frame may start (encoders sometimes pad). */
const MAX_SCAN_BYTES = 64 * 1024;
/** Consecutive frames required: random bytes practically never chain this far. */
const FRAMES_TO_CONFIRM = 4;

/** Length in bytes of the Layer III frame starting at `offset`, or null if there is none. */
export function frameLength(bytes: Uint8Array, offset: number): number | null {
  if (offset + 4 > bytes.length) return null;
  const b1 = bytes[offset + 1] ?? 0;
  const b2 = bytes[offset + 2] ?? 0;
  if (bytes[offset] !== 0xff || (b1 & 0xe0) !== 0xe0) return null;
  const version = (b1 >> 3) & 0x03;
  const layer = (b1 >> 1) & 0x03;
  const bitrateIndex = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const padding = (b2 >> 1) & 0x01;
  const sampleRate = SAMPLE_RATES[version]?.[sampleRateIndex];
  // Layer bits 01 = Layer III; version 01 is reserved; free-format bitrate (0) is not supported.
  if (layer !== 1 || !sampleRate) return null;
  const kbps = (version === 3 ? BITRATES_V1 : BITRATES_V2)[bitrateIndex] ?? 0;
  if (kbps === 0) return null;
  const samplesPerFrame = version === 3 ? 1152 : 576;
  return Math.floor(((samplesPerFrame / 8) * kbps * 1000) / sampleRate) + padding;
}

/** Where the audio starts, after any ID3v2 tags (there can be more than one). */
function skipId3v2(bytes: Uint8Array): number {
  let offset = 0;
  // "ID3", version, revision, flags, then the size as 4 × 7-bit ("syncsafe") bytes.
  while (
    offset + 10 <= bytes.length &&
    bytes[offset] === 0x49 &&
    bytes[offset + 1] === 0x44 &&
    bytes[offset + 2] === 0x33
  ) {
    const flags = bytes[offset + 5] ?? 0;
    let size = 0;
    for (let i = 6; i < 10; i += 1) size = size * 128 + ((bytes[offset + i] ?? 0) & 0x7f);
    const footer = flags & 0x10 ? 10 : 0;
    offset += 10 + size + footer;
  }
  return offset;
}

function confirmsChain(bytes: Uint8Array, start: number, end: number): boolean {
  let offset = start;
  for (let frame = 0; frame < FRAMES_TO_CONFIRM; frame += 1) {
    const length = frameLength(bytes, offset);
    if (!length) return false;
    offset += length;
    // A short file may end right after its last frame.
    if (offset >= end) return frame >= 1;
  }
  return true;
}

/** The byte range of the MPEG audio in `bytes`, or null when the file is not an MP3. */
export function findMp3Audio(bytes: Uint8Array): { start: number; end: number } | null {
  const hasId3v1 =
    bytes.length >= 128 &&
    bytes[bytes.length - 128] === 0x54 && // "TAG"
    bytes[bytes.length - 127] === 0x41 &&
    bytes[bytes.length - 126] === 0x47;
  const end = hasId3v1 ? bytes.length - 128 : bytes.length;
  const tagsEnd = skipId3v2(bytes);
  const scanUntil = Math.min(end - 4, tagsEnd + MAX_SCAN_BYTES);
  for (let offset = tagsEnd; offset <= scanUntil; offset += 1) {
    if (bytes[offset] === 0xff && confirmsChain(bytes, offset, end)) return { start: offset, end };
  }
  return null;
}
