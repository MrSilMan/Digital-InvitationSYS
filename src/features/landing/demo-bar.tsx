import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

import { landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';

import { ctaClasses, WhatsappCta } from './cta-links';
import styles from './landing.module.css';

/**
 * The floating bar over a theme demo: back to the landing page, and the WhatsApp call for this
 * theme. Above the envelope (z-50), so a visitor can leave before opening it.
 */
export function DemoBar({ contactHref, themeName }: { contactHref: string; themeName: string }) {
  const { demo, themes } = landing;
  return (
    <nav
      aria-label={demo.badge}
      className={cn(
        styles.night,
        styles.nightBar,
        'fixed inset-x-3 top-3 z-60 mx-auto flex max-w-lg items-center justify-between gap-2 rounded-full border border-white/15 p-1.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.7)]',
      )}
    >
      <Link href="/" className={ctaClasses('plain', 'small')}>
        <IconArrowLeft size={18} stroke={2} aria-hidden="true" />
        {demo.back}
      </Link>
      <p className="hidden truncate font-script text-2xl leading-none text-accent sm:block">
        {themeName}
      </p>
      <WhatsappCta
        href={contactHref}
        size="small"
        srSuffix={fillTemplate(themes.chooseSuffix, { theme: themeName })}
      >
        {themes.choose}
      </WhatsappCta>
    </nav>
  );
}
