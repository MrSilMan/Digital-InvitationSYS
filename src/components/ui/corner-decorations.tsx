import Image from 'next/image';
import type { CSSProperties } from 'react';

import { decorationsFor, type Decoration, type ThemeArea, type ThemeDefinition } from '@/themes';

interface CornerDecorationsProps {
  theme: ThemeDefinition;
  area: ThemeArea;
  /** Load immediately (first screen); otherwise images load lazily as the guest scrolls. */
  eager?: boolean;
  /** Ahead of everything else: the envelope's florals, the first thing a guest sees (LCP). */
  fetchPriority?: 'high';
}

/** Artwork is drawn for the top-left corner / top edge; other positions mirror it. */
export function decorationStyle(decoration: Decoration): CSSProperties {
  const ox = decoration.offset?.x ?? 0;
  const oy = decoration.offset?.y ?? 0;
  const base: CSSProperties = { width: decoration.width, maxWidth: decoration.maxWidth };
  switch (decoration.position) {
    case 'top-left':
    case 'top':
      return { ...base, top: 0, left: 0, transform: `translate(${ox}%, ${oy}%)` };
    case 'top-right':
      return { ...base, top: 0, right: 0, transform: `translate(${-ox}%, ${oy}%) scaleX(-1)` };
    case 'bottom-left':
      return { ...base, bottom: 0, left: 0, transform: `translate(${ox}%, ${-oy}%) scaleY(-1)` };
    case 'bottom-right':
    case 'bottom':
      return { ...base, bottom: 0, right: 0, transform: `translate(${-ox}%, ${-oy}%) scale(-1)` };
  }
}

/** `sizes` for next/image: a share of the viewport on phones, capped at maxWidth. */
export function decorationSizes(decoration: Decoration): string {
  const share = Number.parseFloat(decoration.width);
  if (!decoration.maxWidth || !Number.isFinite(share) || share <= 0) return decoration.width;
  const breakpoint = Math.round(decoration.maxWidth / (share / 100));
  return `(max-width: ${breakpoint}px) ${share}vw, ${decoration.maxWidth}px`;
}

/**
 * Watercolour florals tucked into a section's corners, as configured by the theme for that area.
 * Place inside a `relative` section; purely decorative (hidden from screen readers).
 */
export function CornerDecorations({
  theme,
  area,
  eager = false,
  fetchPriority,
}: CornerDecorationsProps) {
  const decorations = decorationsFor(theme, area);
  if (decorations.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {decorations.map((decoration, index) => {
        const image = theme.images[decoration.image];
        if (!image) return null;
        return (
          <Image
            key={`${decoration.position}-${index}`}
            src={image.src}
            width={image.width}
            height={image.height}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={fetchPriority}
            sizes={decorationSizes(decoration)}
            className="absolute h-auto max-w-none"
            style={decorationStyle(decoration)}
          />
        );
      })}
    </div>
  );
}
