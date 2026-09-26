import { IconCircleCheck, IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';
import Link from 'next/link';

import { landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import { THEMES } from '@/themes';

import { TryNames } from './couple-preview';
import { ctaClasses, WhatsappCta } from './cta-links';
import { Petals, PhoneFrame, Sparkle } from './decor';
import { LANDING_THEME_ID } from './landing-root';
import styles from './landing.module.css';
import { MiniEnvelope, MiniInvitationCard } from './mini-screens';
import { SECTION_ANCHORS } from './site-chrome';

const { hero, cta, tryIt } = landing;
const HEADING_ID = 'inicio-titulo';

/**
 * Two tilted phones floating over a golden glow: the sealed envelope and the invitation card
 * behind it, in the theme whose fonts the page uses anyway (LANDING_THEME_ID): a second theme
 * here cost the first screen two more font files (the other themes follow right below).
 */
function HeroPhones({ date }: { date: Date }) {
  const theme = THEMES[LANDING_THEME_ID];
  return (
    <figure
      className={cn(
        styles.heroPhones,
        'relative mx-auto aspect-5/6 w-full max-w-136 lg:row-span-2',
      )}
    >
      <figcaption className="sr-only">
        {fillTemplate(hero.phonesCaption, { theme: theme.name })}
      </figcaption>
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgb(217_181_108/0.34),transparent_70%)]" />
        <div className="absolute top-[8%] left-[2%] w-[47%] -rotate-7">
          <div className={styles.float}>
            <PhoneFrame sizeContainer={false}>
              <MiniEnvelope theme={theme} guestName={hero.sampleGuest} sealId="selo-inicio" eager />
            </PhoneFrame>
          </div>
        </div>
        <div className="absolute top-0 right-[2%] w-[47%] rotate-6">
          <div className={styles.floatLate}>
            <PhoneFrame sizeContainer={false}>
              <MiniInvitationCard theme={theme} date={date} guestName={hero.sampleGuest} eager />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </figure>
  );
}

/**
 * The first screen, at night: the promise in gold, the WhatsApp call, and an example invitation
 * that takes the names the visitor types.
 */
export function Hero({ contactHref, date }: { contactHref: string; date: Date }) {
  return (
    <section
      aria-labelledby={HEADING_ID}
      className={cn(styles.night, styles.glow, 'relative overflow-hidden')}
    >
      <Petals />
      <div className="relative mx-auto grid max-w-6xl items-center gap-x-12 gap-y-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-24">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="font-caps text-sm tracking-[0.3em] text-accent uppercase">{hero.eyebrow}</p>
          <h1 id={HEADING_ID} className="relative mt-4">
            <span
              className={cn(
                styles.gold,
                'block pb-2 font-script text-[clamp(4.2rem,16vw,7.6rem)] leading-[1.05]',
              )}
            >
              {hero.titleScript}
            </span>{' '}
            <span className="block font-caps text-[clamp(1.4rem,5.4vw,2.5rem)] leading-tight tracking-wider text-balance text-ink">
              {hero.titleCaps}
            </span>
            <Sparkle className="top-0 right-[6%] size-6 text-accent" />
            <Sparkle className="top-[34%] -left-5 size-4 text-script" delay={1.2} />
            <Sparkle className="-right-4 bottom-[36%] size-3 text-ink" delay={2.1} />
          </h1>
          <p className="mt-6 max-w-xl font-body text-xl leading-relaxed text-muted">{hero.lead}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <WhatsappCta href={contactHref} />
            <a href={`#${SECTION_ANCHORS.themes}`} className={ctaClasses('outline')}>
              {cta.seeThemes}
            </a>
          </div>
          <p className="mt-5 font-body text-lg text-muted">
            {cta.hasAccount}{' '}
            <Link
              href="/entrar"
              className="text-ink underline decoration-accent underline-offset-4 transition-colors hover:text-accent"
            >
              {cta.login}
            </Link>
          </p>
          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 font-button text-sm text-muted lg:justify-start">
            {hero.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <IconCircleCheck
                  size={18}
                  stroke={1.75}
                  aria-hidden="true"
                  className="text-accent"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <HeroPhones date={date} />
        <TryNames labels={tryIt} className="mx-auto lg:mx-0" />
      </div>
    </section>
  );
}

/** The gold ribbon of highlights that scrolls by under the hero. */
export function Ribbon() {
  const { ribbon } = landing;
  const list = (copy: boolean) => (
    <ul
      aria-hidden={copy || undefined}
      className={cn('flex shrink-0 items-center', copy && styles.marqueeCopy)}
    >
      {ribbon.items.map((item) => (
        <li key={item} className="flex items-center whitespace-nowrap">
          <span className="px-6 font-caps text-lg font-medium tracking-[0.08em]">{item}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current opacity-70">
            <path d="M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <section
      aria-label={ribbon.label}
      className={cn(styles.ribbon, 'relative flex items-center overflow-hidden py-4')}
    >
      <div className={styles.marquee}>
        {list(false)}
        {list(true)}
      </div>
      <label className="absolute right-2 grid size-9 cursor-pointer place-items-center rounded-full bg-[#f1d99a] shadow-[0_0_0_6px_#f1d99a] ring-1 ring-[#1b1406]/25 transition-colors hover:bg-[#f6e3b0] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-[#1b1406] motion-reduce:hidden">
        <input type="checkbox" aria-label={ribbon.pause} className="peer sr-only" />
        <IconPlayerPauseFilled size={16} aria-hidden="true" className="peer-checked:hidden" />
        <IconPlayerPlayFilled size={16} aria-hidden="true" className="hidden peer-checked:block" />
      </label>
    </section>
  );
}
