/**
 * Small synthetic media files for tests (no binary fixtures in the repository).
 */

/** An MPEG-1 Layer III frame header: 128 kbit/s, 44.1 kHz, stereo, no padding (417 bytes). */
const FRAME_HEADER = [0xff, 0xfb, 0x90, 0x64];
export const MP3_FRAME_BYTES = 417;

/** An ID3v2.4 tag of `bodySize` bytes (10-byte header, syncsafe size). */
export function id3v2Tag(bodySize: number): Uint8Array {
  const tag = new Uint8Array(10 + bodySize);
  tag.set([0x49, 0x44, 0x33, 4, 0, 0]);
  tag[6] = (bodySize >> 21) & 0x7f;
  tag[7] = (bodySize >> 14) & 0x7f;
  tag[8] = (bodySize >> 7) & 0x7f;
  tag[9] = bodySize & 0x7f;
  return tag;
}

/** An ID3v1 tag: "TAG" and 125 bytes of fields. */
export function id3v1Tag(): Uint8Array {
  const tag = new Uint8Array(128);
  tag.set([0x54, 0x41, 0x47]);
  return tag;
}

/** `count` silent Layer III frames. */
export function mp3Frames(count: number): Uint8Array {
  const frames = new Uint8Array(count * MP3_FRAME_BYTES);
  for (let i = 0; i < count; i += 1) frames.set(FRAME_HEADER, i * MP3_FRAME_BYTES);
  return frames;
}

export function concatBytes(...parts: Uint8Array[]): Buffer {
  return Buffer.concat(parts.map((part) => Buffer.from(part)));
}

/** A tagged MP3: ID3v2 (with "cover art"), audio frames, ID3v1. */
export function taggedMp3(frames = 20): Buffer {
  return concatBytes(id3v2Tag(2048), mp3Frames(frames), id3v1Tag());
}
