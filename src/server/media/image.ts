import 'server-only';

import sharp, { type Metadata, type SharpOptions } from 'sharp';

import { type ImageMediaType, variantWidths } from '@/lib/media/ladder';

/** About 70 megapixels: 50 MP phone photos pass, decompression bombs do not. */
export const MAX_INPUT_PIXELS = 70_000_000;

const INPUT: SharpOptions = {
  // Turn the pixels upright following the EXIF orientation (phones store photos sideways).
  autoOrient: true,
  // Abort on broken pixel data, but not on the harmless warnings many phone apps leave behind.
  failOn: 'error',
  limitInputPixels: MAX_INPUT_PIXELS,
};

const QUALITY: Record<ImageMediaType, number> = { HERO: 80, GALLERY: 80, LOGO: 90 };
const FORMATS = new Set(['jpeg', 'png', 'webp']);
const TIMEOUT_SECONDS = 60;

export class ImageRejectedError extends Error {
  constructor(
    readonly reason: 'unreadable' | 'too-many-pixels',
    options?: ErrorOptions,
  ) {
    super(`Image rejected: ${reason}`, options);
    this.name = 'ImageRejectedError';
  }
}

export interface ProcessedImage {
  /** Size of the upright original. */
  width: number;
  height: number;
  /** WebP files, smallest first. */
  files: { width: number; height: number; body: Buffer }[];
}

/**
 * Upright WebP copies of an uploaded image at the ladder widths. sharp keeps no metadata unless
 * asked: EXIF (GPS position, camera, date) and ICC profiles are dropped and colours converted to
 * sRGB. Animated images keep their first frame.
 */
export async function processImage(input: Buffer, type: ImageMediaType): Promise<ProcessedImage> {
  let metadata: Metadata;
  try {
    // Only the header is read here: the pixel limit is checked below, with its own reason.
    metadata = await sharp(input, { ...INPUT, limitInputPixels: false }).metadata();
  } catch (err) {
    throw new ImageRejectedError('unreadable', { cause: err });
  }
  if (!FORMATS.has(metadata.format)) throw new ImageRejectedError('unreadable');
  const { width, height } = metadata.autoOrient;
  if (width * height > MAX_INPUT_PIXELS) throw new ImageRejectedError('too-many-pixels');

  const files: ProcessedImage['files'] = [];
  for (const target of variantWidths({ width, height }, type)) {
    try {
      const { data, info } = await sharp(input, INPUT)
        .timeout({ seconds: TIMEOUT_SECONDS })
        .resize({ width: target })
        .webp({ quality: QUALITY[type] })
        .toBuffer({ resolveWithObject: true });
      files.push({ width: info.width, height: info.height, body: data });
    } catch (err) {
      // Broken pixel data only shows up while decoding.
      throw new ImageRejectedError('unreadable', { cause: err });
    }
  }
  return { width, height, files };
}
