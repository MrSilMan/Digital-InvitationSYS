import { IconBrandWhatsapp } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

type CtaVariant = 'gold' | 'outline' | 'plain';
type CtaSize = 'regular' | 'small';

const VARIANTS: Record<CtaVariant, string> = {
  gold: 'bg-accent text-accent-contrast shadow-[0_14px_30px_-14px_rgb(217_181_108/0.8)] hover:brightness-110 active:brightness-95',
  outline: 'border border-current/35 text-ink hover:border-accent hover:text-accent',
  plain: 'text-ink hover:text-accent',
};

const SIZES: Record<CtaSize, string> = {
  regular: 'min-h-12 gap-2.5 px-6 py-3',
  small: 'min-h-10 gap-2 px-4 py-2',
};

/**
 * Classes of the landing page's buttons (system font, like the invitation's buttons). Variants
 * and sizes are separate so no class overrides another (`cn` does not merge Tailwind conflicts).
 */
export function ctaClasses(variant: CtaVariant = 'gold', size: CtaSize = 'regular'): string {
  return cn(
    'inline-flex items-center justify-center rounded-full font-button text-sm font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-safe:active:scale-[0.97]',
    SIZES[size],
    VARIANTS[variant],
  );
}

/**
 * Opens a WhatsApp chat with the team (a new tab; wa.me hands over to the app). Screen readers
 * hear where it goes after the visible text.
 */
export function WhatsappCta({
  href,
  children = landing.cta.create,
  srSuffix = landing.cta.opensWhatsapp,
  variant = 'gold',
  size = 'regular',
}: {
  href: string;
  children?: ReactNode;
  srSuffix?: string;
  variant?: CtaVariant;
  size?: CtaSize;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-contact-whatsapp=""
      className={ctaClasses(variant, size)}
    >
      <IconBrandWhatsapp size={size === 'small' ? 18 : 22} stroke={1.75} aria-hidden="true" />
      <span>
        {children}
        <span className="sr-only"> {srSuffix}</span>
      </span>
    </a>
  );
}
