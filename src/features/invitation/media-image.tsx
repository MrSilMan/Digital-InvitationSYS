'use client';

import Image, { type ImageProps } from 'next/image';

import { pickWidth, processedFolder } from '@/lib/media/ladder';

interface MediaImageProps extends ImageProps {
  /** Widths of the processed files, for uploaded images (`InvitationImage.widths`). */
  widths?: readonly number[];
}

/**
 * next/image for invitation pictures. Uploaded images already exist in a few widths (`/m/…`):
 * the browser picks one of those files and the server never re-encodes them. Theme art and demo
 * photos go through the default optimizer.
 */
export function MediaImage({ widths, src, alt, ...props }: MediaImageProps) {
  const folder = typeof src === 'string' ? processedFolder(src) : null;
  if (!folder) return <Image src={src} alt={alt} {...props} />;
  if (!widths || widths.length < 2) return <Image src={src} alt={alt} unoptimized {...props} />;
  // The folder as `src`: every URL comes from the loader (next/image warns when one equals `src`).
  return (
    <Image
      src={folder}
      alt={alt}
      loader={({ width }) => `${folder}w${pickWidth(width, widths)}.webp`}
      {...props}
    />
  );
}
