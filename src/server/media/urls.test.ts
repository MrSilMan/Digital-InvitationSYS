import { describe, expect, it } from 'vitest';

import { mediaUrl } from '@/server/media/urls';

describe('media URLs', () => {
  it('serves demo media from /public/demo', () => {
    expect(mediaUrl('demo/gallery/foto-1.webp')).toBe('/demo/gallery/foto-1.webp');
    expect(mediaUrl('demo/musica.wav')).toBe('/demo/musica.wav');
  });

  it.each([
    'demo/../env.local',
    'demo//x.webp',
    'demo/gallery/foto.svg',
    '/demo/foto.webp',
    'uploads/event/foto.webp',
  ])('has no URL for %s (yet, or ever)', (key) => {
    expect(mediaUrl(key)).toBeNull();
  });
});
