import { describe, expect, it } from 'vitest';

import {
  audioKey,
  imageVariantKey,
  isDeletablePrefix,
  originalKey,
  processedPrefix,
  servedPath,
} from './keys';

const EVENT = '0199aa00-0000-7000-8000-000000000001';
const MEDIA = '0199aa00-0000-7000-8000-000000000002';

describe('storage keys', () => {
  it('keeps originals apart from what pages show', () => {
    expect(originalKey(EVENT, MEDIA, 'image/jpeg')).toBe(`originals/${EVENT}/${MEDIA}.jpg`);
    expect(originalKey(EVENT, MEDIA, 'audio/mpeg')).toBe(`originals/${EVENT}/${MEDIA}.mp3`);
    expect(originalKey(EVENT, MEDIA, 'text/html')).toBe(`originals/${EVENT}/${MEDIA}.bin`);
    expect(imageVariantKey(EVENT, MEDIA, 960)).toBe(`media/${EVENT}/${MEDIA}/w960.webp`);
    expect(audioKey(EVENT, MEDIA)).toBe(`media/${EVENT}/${MEDIA}/musica.mp3`);
    expect(processedPrefix(EVENT, MEDIA)).toBe(`media/${EVENT}/${MEDIA}/`);
  });

  it('serves only processed files, at /m/…', () => {
    expect(servedPath(imageVariantKey(EVENT, MEDIA, 480))).toBe(`/m/${EVENT}/${MEDIA}/w480.webp`);
    expect(servedPath(audioKey(EVENT, MEDIA))).toBe(`/m/${EVENT}/${MEDIA}/musica.mp3`);
    expect(servedPath(originalKey(EVENT, MEDIA, 'image/jpeg'))).toBeNull();
    expect(servedPath('media/../originals/x.webp')).toBeNull();
  });

  it('deletes by prefix only below one ID', () => {
    expect(isDeletablePrefix(processedPrefix(EVENT, MEDIA))).toBe(true);
    expect(isDeletablePrefix(`originals/${EVENT}/`)).toBe(true);
    expect(isDeletablePrefix('media/')).toBe(false);
    expect(isDeletablePrefix('')).toBe(false);
    expect(isDeletablePrefix(`media/${EVENT}`)).toBe(false);
    expect(isDeletablePrefix('demo/gallery/')).toBe(false);
    expect(isDeletablePrefix('media/../')).toBe(false);
  });
});
