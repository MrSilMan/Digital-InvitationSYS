import { describe, expect, it } from 'vitest';

import { findMp3Audio, frameLength } from './mp3';
import { concatBytes, id3v2Tag, MP3_FRAME_BYTES, mp3Frames, taggedMp3 } from './test-files';

describe('MP3 check', () => {
  it('reads Layer III frame lengths', () => {
    expect(frameLength(mp3Frames(1), 0)).toBe(MP3_FRAME_BYTES);
    // Padding bit set: one byte more.
    expect(frameLength(new Uint8Array([0xff, 0xfb, 0x92, 0x64]), 0)).toBe(MP3_FRAME_BYTES + 1);
    // MPEG-2, 64 kbit/s, 22.05 kHz: 72 × 64000 / 22050.
    expect(frameLength(new Uint8Array([0xff, 0xf3, 0x80, 0x64]), 0)).toBe(208);
  });

  it('rejects headers that are not Layer III audio', () => {
    // AAC in ADTS (layer bits 00), reserved version, free-format and invalid bitrates.
    expect(frameLength(new Uint8Array([0xff, 0xf1, 0x50, 0x80]), 0)).toBeNull();
    expect(frameLength(new Uint8Array([0xff, 0xeb, 0x90, 0x64]), 0)).toBeNull();
    expect(frameLength(new Uint8Array([0xff, 0xfb, 0x00, 0x64]), 0)).toBeNull();
    expect(frameLength(new Uint8Array([0xff, 0xfb, 0xf0, 0x64]), 0)).toBeNull();
    expect(frameLength(new Uint8Array([0xff, 0xfb, 0x9c, 0x64]), 0)).toBeNull();
  });

  it('finds the audio between the ID3 tags', () => {
    const file = taggedMp3(20);
    expect(findMp3Audio(file)).toEqual({ start: 2058, end: 2058 + 20 * MP3_FRAME_BYTES });
  });

  it('accepts untagged files and a little padding after the tag', () => {
    expect(findMp3Audio(mp3Frames(10))).toEqual({ start: 0, end: 10 * MP3_FRAME_BYTES });
    const padded = concatBytes(id3v2Tag(100), new Uint8Array(37), mp3Frames(10));
    expect(findMp3Audio(padded)).toEqual({ start: 147, end: padded.length });
  });

  it('refuses other files', () => {
    const wav = concatBytes(new TextEncoder().encode('RIFF\0\0\0\0WAVEfmt '), new Uint8Array(4000));
    const jpeg = concatBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), new Uint8Array(4000));
    const noise = new Uint8Array(8000).map((_, index) => (index * 7919) % 251);
    expect(findMp3Audio(wav)).toBeNull();
    expect(findMp3Audio(jpeg)).toBeNull();
    expect(findMp3Audio(noise)).toBeNull();
    expect(findMp3Audio(new Uint8Array(0))).toBeNull();
    // One lone frame is not enough.
    expect(findMp3Audio(mp3Frames(1))).toBeNull();
  });
});
