import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

import { SectionTitle } from '@/components/ui/section-title';
import { landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

import { LiveMonogram } from './couple-preview';
import { ctaClasses, WhatsappCta } from './cta-links';
import { Petals, WaxSeal } from './decor';
import styles from './landing.module.css';
import { SECTION_ANCHORS } from './site-chrome';

/*
 * The page's last sections, on the paper and then at night: how it works, the questions, and
 * the closing call.
 */

/** "Como funciona": four steps on a dotted line, from the first message to the answers. */
export function HowItWorks({ contactHref }: { contactHref: string }) {
  const t = landing.howItWorks;
  const headingId = 'como-funciona-titulo';
  return (
    <section
      id={SECTION_ANCHORS.howItWorks}
      aria-labelledby={headingId}
      className="scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionTitle id={headingId} script={t.script} caps={t.caps} />
        <div className="relative mt-16">
          <div
            aria-hidden="true"
            className="absolute top-8 right-[12.5%] left-[12.5%] hidden border-t-[3px] border-dotted border-accent/60 lg:block"
          />
          <ol className="relative grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {t.steps.map((step, index) => (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                <span
                  aria-hidden="true"
                  className="grid size-16 place-items-center rounded-full bg-paper font-script text-5xl leading-none text-script shadow-[0_10px_24px_-14px_rgb(29_36_51/0.6)] ring-2 ring-accent"
                >
                  {index + 1}
                </span>
                <h3 className="mt-6 font-caps text-2xl font-medium tracking-wide">{step.title}</h3>
                <p className="mt-3 max-w-xs font-body text-lg leading-relaxed text-muted">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-16 flex justify-center">
          <WhatsappCta href={contactHref} />
        </div>
      </div>
    </section>
  );
}

/** "Perguntas frequentes": one answer open at a time (details with a shared name), no JavaScript. */
export function Faq() {
  const t = landing.faq;
  const headingId = 'perguntas-titulo';
  return (
    <section
      id={SECTION_ANCHORS.faq}
      aria-labelledby={headingId}
      className="scroll-mt-16 px-4 pb-24 sm:px-6 lg:pb-32"
    >
      <SectionTitle id={headingId} script={t.script} caps={t.caps} />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-black/10 rounded-[2rem] bg-white/75 px-6 shadow-[0_24px_60px_-36px_rgb(29_36_51/0.45)] ring-1 ring-black/5 sm:px-10">
        {t.items.map((item) => (
          <details key={item.question} name="perguntas" className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-body text-xl leading-snug font-medium text-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/40 text-accent transition-transform group-open:rotate-45"
              >
                <IconPlus size={18} stroke={1.75} />
              </span>
            </summary>
            <p className="-mt-1 pb-6 font-body text-lg leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** The closing call, at night again: the seal, "Vamos começar?" in gold, the two ways in. */
export function FinalCall({ contactHref }: { contactHref: string }) {
  const { final, cta } = landing;
  const headingId = 'comecar-titulo';
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        styles.night,
        styles.glow,
        'relative overflow-hidden px-4 py-24 text-center sm:px-6 lg:py-32',
      )}
    >
      <Petals count={10} />
      <div className="relative mx-auto max-w-3xl">
        <WaxSeal gradientId="selo-final" className="mx-auto w-24">
          <LiveMonogram className="text-4xl" style={{ color: 'var(--theme-seal-ink)' }} />
        </WaxSeal>
        <h2
          id={headingId}
          className={cn(
            styles.gold,
            'mt-6 pb-2 font-script text-[clamp(3.8rem,13vw,6.8rem)] leading-[1.1]',
          )}
        >
          {final.script}
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-body text-xl leading-relaxed text-muted">
          {final.text}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <WhatsappCta href={contactHref} />
          <Link href="/entrar" className={ctaClasses('outline')}>
            {cta.login}
          </Link>
        </div>
      </div>
    </section>
  );
}
