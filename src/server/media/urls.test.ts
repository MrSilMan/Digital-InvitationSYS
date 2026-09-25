import { describe, expect, it } from 'vitest';

import { mediaUrl } from '@/server/media/urls';

describe('media URLs', () => {
  it('serves demo media from /public/demo', () => {
    expect(mediaUrl('demo/gallery/foto-1.webp')).toBe('/demo/gallery/foto-1.webp');
    expect(mediaUrl('demo/musica.wav')).toBe('/demo/musica.wav');
  });

  it('serves processed files through the app (/m/…)', () => {
    expect(mediaUrl('media/0199aa-ev/0199bb-md/w960.webp')).toBe(
      '/m/0199aa-ev/0199bb-md/w960.webp',
    );
    expect(mediaUrl('media/ev/md/musica.mp3')).toBe('/m/ev/md/musica.mp3');
  });

  it.each([
    'demo/../env.local',
    'demo//x.webp',
    'demo/gallery/foto.svg',
    '/demo/foto.webp',
    'uploads/event/foto.webp',
    // Originals may carry GPS data: never served.
    'originals/ev/md.jpg',
    'media/ev/md/w960.jpg',
    'media/ev/../md/w960.webp',
    'media/w960.webp',
    'media/EV/md/w960.webp',
  ])('has no URL for %s', (key) => {
    expect(mediaUrl(key)).toBeNull();
  });
});
