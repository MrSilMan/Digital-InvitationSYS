import Link from 'next/link';

import { app, landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';

import { ctaClasses, WhatsappCta } from './cta-links';
import styles from './landing.module.css';

/** In-page anchors of the landing page's sections. */
export const SECTION_ANCHORS = {
  themes: 'temas',
  experience: 'experiencia',
  features: 'inclui',
  howItWorks: 'como-funciona',
  faq: 'perguntas',
} as const;

const { nav } = landing;
const NAV_LINKS = [
  [SECTION_ANCHORS.themes, nav.themes],
  [SECTION_ANCHORS.experience, nav.experience],
  [SECTION_ANCHORS.features, nav.features],
  [SECTION_ANCHORS.howItWorks, nav.howItWorks],
  [SECTION_ANCHORS.faq, nav.faq],
] as const;

export const MAIN_ID = 'conteudo';

/** A gold underline that grows from the centre on hover and keyboard focus. */
const NAV_LINK_CLASSES =
  'relative py-1 transition-colors hover:text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none';

/** Sticky night bar: the wordmark, the sections (wide screens), login and the WhatsApp call. */
export function SiteHeader({ contactHref }: { contactHref: string }) {
  return (
    <header
      className={cn(styles.night, styles.nightBar, 'sticky top-0 z-40 border-b border-white/10')}
    >
      <a
        href={`#${MAIN_ID}`}
        className="sr-only rounded-full bg-accent px-5 py-2.5 font-button text-sm font-semibold text-accent-contrast focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        {landing.skipToContent}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-script text-[2rem] leading-none whitespace-nowrap text-accent"
        >
          {app.name}
        </Link>
        <nav aria-label={nav.label} className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-7 font-button text-sm text-muted">
            {NAV_LINKS.map(([anchor, label]) => (
              <li key={anchor}>
                <a href={`#${anchor}`} className={NAV_LINK_CLASSES}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <Link href="/entrar" className={ctaClasses('outline', 'small')}>
            {nav.login}
          </Link>
          {/* Phones: the hero's button is right below, and the bar has no room for both. */}
          <div className="hidden sm:block">
            <WhatsappCta href={contactHref} size="small">
              {landing.cta.createShort}
            </WhatsappCta>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ contactHref, year }: { contactHref: string; year: number }) {
  const { footer } = landing;
  return (
    <footer className={cn(styles.night, styles.footer)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <p className="font-script text-5xl leading-none text-accent">{app.name}</p>
          <p className="mt-3 font-body text-lg text-muted">{footer.tagline}</p>
        </div>
        <nav aria-label={footer.navLabel}>
          <ul className="grid grid-cols-2 gap-x-12 gap-y-3 font-button text-sm text-muted">
            {NAV_LINKS.map(([anchor, label]) => (
              <li key={anchor}>
                <a href={`#${anchor}`} className="transition-colors hover:text-accent">
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/entrar" className="transition-colors hover:text-accent">
                {nav.login}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 font-button text-sm text-muted sm:px-6">
          <p>{fillTemplate(footer.rights, { year: String(year) })}</p>
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-accent underline-offset-4 transition-colors hover:text-accent"
          >
            {footer.contact}
          </a>
        </div>
      </div>
    </footer>
  );
}
