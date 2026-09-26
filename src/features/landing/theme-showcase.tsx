import { IconHeart } from '@tabler/icons-react';
import Link from 'next/link';

import { ThemeRoot } from '@/components/theme/theme-root';
import { CornerDecorations } from '@/components/ui/corner-decorations';
import { pillButtonClasses } from '@/components/ui/pill-button-classes';
import { SectionTitle } from '@/components/ui/section-title';
import { landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import { THEMES, themeCssVariables, type ThemeDefinition, type ThemeId } from '@/themes';
import { themeFontClassName, themeFontNames } from '@/themes/fonts';

import { contactUrl } from './contact';
import { WhatsappCta } from './cta-links';
import { PhoneFrame } from './decor';
import { LANDING_THEME_ID } from './landing-root';
import styles from './landing.module.css';
import { MiniSaveTheDate } from './mini-screens';
import { SECTION_ANCHORS } from './site-chrome';

const t = landing.themes;
const HEADING_ID = 'temas-titulo';

/** Every theme needs its landing page text: TypeScript asks for an entry when one is added. */
const THEME_COPY: Record<ThemeId, { tagline: string; description: string }> = t.items;

/** The public demo of a theme (app/(public)/demonstracao/[themeId]). */
export function themeDemoPath(themeId: ThemeId): string {
  return `/demonstracao/${themeId}`;
}

const labelClass = 'font-button text-xs font-semibold tracking-[0.18em] text-muted uppercase';

function ThemeCard({
  themeId,
  reverse,
  contactPhone,
  date,
}: {
  themeId: ThemeId;
  reverse: boolean;
  contactPhone: string;
  date: Date;
}) {
  const theme: ThemeDefinition = THEMES[themeId];
  const copy = THEME_COPY[themeId];
  const fonts = themeFontNames(themeId);
  const headingId = `tema-${theme.id}`;
  const swatches = [
    theme.colors.background,
    theme.colors.script,
    theme.colors.accent,
    theme.colors.ink,
    theme.envelope.seal,
  ];
  const circle = theme.buttonShape === 'circle';

  return (
    <article
      aria-labelledby={headingId}
      className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <figure className={cn('relative', reverse && 'lg:order-2')}>
        <figcaption className="sr-only">
          {fillTemplate(t.previewCaption, { theme: theme.name })}
        </figcaption>
        <ThemeRoot
          theme={theme}
          container={false}
          className="relative mx-auto flex aspect-4/5 max-w-120 items-center justify-center overflow-hidden rounded-[2.5rem] shadow-[0_34px_60px_-34px_rgb(29_36_51/0.5)] ring-1 ring-black/5"
        >
          <CornerDecorations theme={theme} area="guestManual" />
          <div aria-hidden="true" className="relative w-[48%] -rotate-3">
            <PhoneFrame>
              <MiniSaveTheDate theme={theme} date={date} />
            </PhoneFrame>
          </div>
        </ThemeRoot>
      </figure>

      {/* The theme's own fonts and colours, on the landing page's paper. */}
      <div className={themeFontClassName(theme.id)} style={themeCssVariables(theme)}>
        <p className={labelClass}>{copy.tagline}</p>
        <h3
          id={headingId}
          className="mt-2 font-script text-[clamp(3.6rem,11vw,5.2rem)] leading-[1.1] text-script"
        >
          {theme.name}
        </h3>
        <p className="mt-4 max-w-xl font-body text-xl leading-relaxed text-ink">
          {copy.description}
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <dt className={labelClass}>{t.palette}</dt>
            <dd className="mt-3 flex flex-wrap gap-1.5">
              {swatches.map((color, index) => (
                <span
                  key={index}
                  className="size-7 rounded-full shadow-inner ring-1 ring-black/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </dd>
          </div>
          <div>
            <dt className={labelClass}>{t.buttons}</dt>
            <dd className="mt-2.5 flex items-center gap-3 font-body text-lg text-ink">
              <span
                aria-hidden="true"
                className={cn(
                  'grid place-items-center bg-accent text-accent-contrast shadow-sm',
                  circle ? 'size-9 rounded-full' : 'h-8 w-16 rounded-full',
                )}
              >
                <IconHeart size={16} stroke={1.75} />
              </span>
              {t.buttonShapes[theme.buttonShape]}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className={labelClass}>{t.fonts}</dt>
            <dd className="mt-1.5 leading-tight text-ink">
              <span className="block font-script text-3xl text-script">{fonts.script}</span>
              <span className="block font-caps text-lg">{fonts.caps}</span>
              <span className="block font-body text-lg">{fonts.body}</span>
            </dd>
          </div>
        </dl>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link href={themeDemoPath(themeId)} className={pillButtonClasses('pill')}>
            <span>
              {t.demo}
              <span className="sr-only"> {fillTemplate(t.demoSuffix, { theme: theme.name })}</span>
            </span>
          </Link>
          <WhatsappCta
            href={contactUrl(contactPhone, theme.name)}
            variant="outline"
            srSuffix={fillTemplate(t.chooseSuffix, { theme: theme.name })}
          >
            {t.choose}
          </WhatsappCta>
        </div>
      </div>
    </article>
  );
}

/** "Os nossos temas": every theme, as its Save the Date on its paper, with a demo link. */
export function ThemeShowcase({ contactPhone, date }: { contactPhone: string; date: Date }) {
  // The page's own theme first: its fonts and artwork are already loaded (see LANDING_THEME_ID).
  const themeIds: ThemeId[] = [
    LANDING_THEME_ID,
    ...(Object.keys(THEMES) as ThemeId[]).filter((id) => id !== LANDING_THEME_ID),
  ];
  return (
    <section
      id={SECTION_ANCHORS.themes}
      aria-labelledby={HEADING_ID}
      className="scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
        <p className="mx-auto mt-5 max-w-2xl text-center font-body text-xl leading-relaxed text-muted">
          {t.intro}
        </p>
        <ul className="mt-16 flex flex-col gap-24 lg:mt-20 lg:gap-32">
          {/* Each card on its own: on phones the section starts right below the hero, close
              enough to be rendered at once, with every theme's fonts and artwork. */}
          {themeIds.map((themeId, index) => (
            <li key={themeId} className={styles.deferred}>
              <ThemeCard
                themeId={themeId}
                reverse={index % 2 === 1}
                contactPhone={contactPhone}
                date={date}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
