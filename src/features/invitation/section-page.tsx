import Image from 'next/image';
import type { ReactNode } from 'react';

import { CornerDecorations } from '@/components/ui/corner-decorations';
import { Monogram } from '@/components/ui/monogram';
import { cn } from '@/lib/cn';
import type { ThemeArea, ThemeDefinition } from '@/themes';

import type { InvitationEvent, InvitationImage } from './types';

interface SectionPageProps {
  theme: ThemeDefinition;
  area: ThemeArea;
  /** Id of the heading that names the section. */
  labelledBy: string;
  /** Load the florals immediately (first screen). */
  eager?: boolean;
  /** Pinned to the bottom edge, full width (the hero illustration). */
  footer?: ReactNode;
  /** Side padding for the content; off for full-bleed content (the gallery carousel). */
  padded?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * One full-screen "page" of the invitation (at least 100svh, snap point), with the theme's florals
 * for its area and the content centred.
 */
export function SectionPage({
  theme,
  area,
  labelledBy,
  eager = false,
  footer,
  padded = true,
  contentClassName,
  children,
}: SectionPageProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      data-area={area}
      className="relative flex min-h-svh snap-start flex-col overflow-hidden"
    >
      <CornerDecorations theme={theme} area={area} eager={eager} />
      <div
        className={cn(
          'relative flex w-full flex-1 flex-col items-center justify-center gap-6 py-20 text-center',
          padded && 'px-6',
          contentClassName,
        )}
      >
        {children}
      </div>
      {footer}
    </section>
  );
}

/** The illustration at the bottom of the invitation card and the Save the Date. Decorative. */
export function HeroIllustration({
  theme,
  image,
  eager = false,
}: {
  theme: ThemeDefinition;
  image: InvitationImage | null;
  eager?: boolean;
}) {
  const hero = image ?? theme.hero;
  return (
    <Image
      src={hero.src}
      width={hero.width}
      height={hero.height}
      alt=""
      sizes="(max-width: 480px) 100vw, 480px"
      loading={eager ? 'eager' : 'lazy'}
      className="relative block h-auto w-full"
    />
  );
}

/** The couple's uploaded logo, or their monogram. Decorative (the names appear in full). */
export function CoupleMark({
  event,
  className,
}: {
  event: Pick<InvitationEvent, 'logo' | 'monogram'>;
  className?: string;
}) {
  if (event.logo) {
    return (
      <Image
        src={event.logo.src}
        width={event.logo.width}
        height={event.logo.height}
        alt=""
        sizes="160px"
        className="h-24 w-auto"
      />
    );
  }
  return <Monogram initials={event.monogram} className={className} />;
}
