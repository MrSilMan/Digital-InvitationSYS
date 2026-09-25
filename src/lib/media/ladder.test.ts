import { describe, expect, it } from 'vitest';

import { pickWidth, processedFolder, variantWidths } from './ladder';

describe('image sizes', () => {
  it('writes every ladder width below the image, plus its own width, capped per type', () => {
    expect(variantWidths({ width: 4032, height: 3024 }, 'GALLERY')).toEqual([480, 960, 1600]);
    expect(variantWidths({ width: 1200, height: 900 }, 'GALLERY')).toEqual([480, 960, 1200]);
    expect(variantWidths({ width: 3000, height: 2000 }, 'HERO')).toEqual([540, 1080]);
    expect(variantWidths({ width: 800, height: 600 }, 'HERO')).toEqual([540, 800]);
    expect(variantWidths({ width: 2000, height: 2000 }, 'LOGO')).toEqual([240, 480]);
  });

  it('never enlarges a small image', () => {
    expect(variantWidths({ width: 300, height: 200 }, 'GALLERY')).toEqual([300]);
    expect(variantWidths({ width: 480, height: 480 }, 'GALLERY')).toEqual([480]);
    expect(variantWidths({ width: 100, height: 40 }, 'LOGO')).toEqual([100]);
  });

  it('keeps very tall images at most 3200 pixels high', () => {
    expect(variantWidths({ width: 1000, height: 20_000 }, 'GALLERY')).toEqual([160]);
    expect(variantWidths({ width: 1080, height: 2400 }, 'GALLERY')).toEqual([480, 960, 1080]);
    expect(variantWidths({ width: 1440, height: 3200 }, 'GALLERY')).toEqual([480, 960, 1440]);
  });

  it('picks the smallest file that covers the requested width', () => {
    const widths = [480, 960, 1600];
    expect(pickWidth(100, widths)).toBe(480);
    expect(pickWidth(480, widths)).toBe(480);
    expect(pickWidth(481, widths)).toBe(960);
    expect(pickWidth(1200, widths)).toBe(1600);
    expect(pickWidth(3840, widths)).toBe(1600);
    expect(pickWidth(700, [1080, 540])).toBe(1080);
  });

  it('finds the folder of processed images only', () => {
    expect(processedFolder('/m/ev-1/md-2/w1600.webp')).toBe('/m/ev-1/md-2/');
    expect(processedFolder('/demo/gallery/foto-1.webp')).toBeNull();
    expect(processedFolder('/themes/praia-rosa/hero.webp')).toBeNull();
    expect(processedFolder('/m/ev-1/md-2/musica.mp3')).toBeNull();
  });
});
