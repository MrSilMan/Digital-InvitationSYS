import { crc32 } from 'node:zlib';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { ImageRejectedError, processImage } from './image';

/**
 * A phone photo stored sideways: 2000×1500 pixels with EXIF orientation 6 (turn 90° clockwise to
 * view), a GPS position and a red square in the stored top-left corner, over blue.
 */
async function sidewaysPhoto(): Promise<Buffer> {
  const red = await sharp({
    create: { width: 400, height: 400, channels: 3, background: '#ff0000' },
  })
    .png()
    .toBuffer();
  return sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#0000ff' } })
    .composite([{ input: red, left: 0, top: 0 }])
    .jpeg({ quality: 90 })
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD0: { Make: 'TestPhone' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '8/1 50/1 0/1' },
    })
    .toBuffer();
}

/** A real PNG whose header claims another size (the CRC is fixed so decoders read it). */
function pngClaiming(png: Buffer, width: number, height: number): Buffer {
  const patched = Buffer.from(png);
  patched.writeUInt32BE(width, 16);
  patched.writeUInt32BE(height, 20);
  patched.writeUInt32BE(crc32(patched.subarray(12, 29)), 29);
  return patched;
}

async function rejection(input: Buffer): Promise<unknown> {
  return processImage(input, 'GALLERY').then(
    () => null,
    (err: unknown) => err,
  );
}

describe('image processing', () => {
  it('writes upright WebP files at the ladder widths, without any metadata', async () => {
    const input = await sidewaysPhoto();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const result = await processImage(input, 'GALLERY');
    expect({ width: result.width, height: result.height }).toEqual({ width: 1500, height: 2000 });
    expect(result.files.map((file) => [file.width, file.height])).toEqual([
      [480, 640],
      [960, 1280],
      [1500, 2000],
    ]);
    for (const file of result.files) {
      const metadata = await sharp(file.body).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.exif).toBeUndefined();
      expect(metadata.orientation).toBeUndefined();
    }

    // The stored top-left corner is now the top-right one.
    const smallest = result.files[0]?.body;
    const { data, info } = await sharp(smallest).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => {
      const index = (y * info.width + x) * info.channels;
      return { red: data[index] ?? 0, blue: data[index + 2] ?? 0 };
    };
    expect(pixel(info.width - 10, 10).red).toBeGreaterThan(200);
    expect(pixel(10, 10).blue).toBeGreaterThan(200);
  });

  it('keeps transparency and uses each type’s sizes', async () => {
    const transparent = await sharp({
      create: { width: 1200, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    const hero = await processImage(transparent, 'HERO');
    expect(hero.files.map((file) => file.width)).toEqual([540, 1080]);
    expect((await sharp(hero.files[0]?.body).metadata()).hasAlpha).toBe(true);

    const logo = await processImage(transparent, 'LOGO');
    expect(logo.files.map((file) => file.width)).toEqual([240, 480]);
  });

  it('refuses files that are not a readable JPEG, PNG or WebP', async () => {
    const gif = await sharp({
      create: { width: 10, height: 10, channels: 3, background: '#ffffff' },
    })
      .gif()
      .toBuffer();
    const photo = await sidewaysPhoto();
    const truncated = photo.subarray(0, Math.floor(photo.length / 2));

    for (const input of [Buffer.from('not an image'), gif, truncated]) {
      const err = await rejection(input);
      expect(err).toBeInstanceOf(ImageRejectedError);
      expect(err).toMatchObject({ reason: 'unreadable' });
    }
  });

  it('refuses images with too many pixels before decoding them', async () => {
    const png = await sharp({
      create: { width: 1, height: 1, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
    const err = await rejection(pngClaiming(png, 9000, 9000));
    expect(err).toMatchObject({ reason: 'too-many-pixels' });
  });
});
