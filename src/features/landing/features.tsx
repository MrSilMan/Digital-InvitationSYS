import {
  IconBolt,
  IconBrandWhatsapp,
  IconCalendarHeart,
  IconCheck,
  IconGift,
  IconHanger,
  IconHourglassHigh,
  IconMapPin,
  IconMoodHappy,
  IconMusic,
  IconPhoto,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { SectionTitle } from '@/components/ui/section-title';
import { guests, invitation, landing } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

import { LiveMonogram } from './couple-preview';
import { Sparkle, WaxSeal } from './decor';
import styles from './landing.module.css';
import { SECTION_ANCHORS } from './site-chrome';

const t = landing.features;
const HEADING_ID = 'inclui-titulo';
const [firstGuest = '', secondGuest = '', thirdGuest = '', fourthGuest = ''] = t.sampleGuests;

type FeatureKey = keyof typeof t.items;

function Tile({ feature, visual }: { feature: FeatureKey; visual: ReactNode }) {
  const { title, text } = t.items[feature];
  return (
    <li className="col-span-2 flex flex-col gap-6 rounded-[1.75rem] border border-white/10 bg-white/4 p-6 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:p-7">
      <div className="sm:flex-1">
        <h3 className="font-caps text-2xl font-medium tracking-wide text-ink">{title}</h3>
        <p className="mt-2 font-body text-lg leading-snug text-muted">{text}</p>
      </div>
      <div
        aria-hidden="true"
        className="flex min-h-36 shrink-0 items-center justify-center sm:w-[46%]"
      >
        {visual}
      </div>
    </li>
  );
}

function SmallTile({ feature, icon }: { feature: FeatureKey; icon: ReactNode }) {
  const { title, text } = t.items[feature];
  return (
    <li className="rounded-[1.75rem] border border-white/10 bg-white/4 p-4 transition-colors hover:border-accent/40 sm:p-6">
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-full border border-accent/40 text-accent sm:size-12"
      >
        {icon}
      </span>
      <h3 className="mt-4 font-caps text-lg leading-snug font-medium tracking-wide text-ink sm:mt-5 sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 font-body text-base leading-snug text-muted sm:text-lg">{text}</p>
    </li>
  );
}

const iconProps = { size: 24, stroke: 1.5 } as const;

const chip = 'rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap';

/** "Tudo o que o vosso convite inclui": four illustrated cards, then eight small ones. */
export function Features() {
  return (
    <section
      id={SECTION_ANCHORS.features}
      aria-labelledby={HEADING_ID}
      className={cn(styles.night, 'relative scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28')}
    >
      <div className="mx-auto max-w-6xl">
        <SectionTitle id={HEADING_ID} script={t.script} caps={t.caps} />
        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Tile
            feature="envelope"
            visual={
              <div className="relative">
                <WaxSeal gradientId="selo-inclui" className="w-28">
                  <LiveMonogram className="text-4xl" style={{ color: 'var(--theme-seal-ink)' }} />
                </WaxSeal>
                <IconMusic
                  size={30}
                  stroke={1.5}
                  className="absolute -top-3 -right-8 text-script"
                />
                <Sparkle className="-bottom-1 -left-6 size-4 text-accent" delay={0.8} />
              </div>
            }
          />
          <Tile
            feature="personal"
            visual={
              <div className="w-full max-w-64">
                <div
                  className={cn(
                    styles.ticker,
                    'text-center font-caps text-xl leading-tight font-bold tracking-[0.04em] text-ink uppercase',
                  )}
                >
                  <div className={styles.tickerTrack}>
                    {[firstGuest, secondGuest, thirdGuest, firstGuest].map((name, index) => (
                      <span key={index} className="block truncate">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="size-3 shrink-0 rounded-full border-2 border-accent" />
                  <span className="h-0 flex-1 border-t-[3px] border-dotted border-accent" />
                  <span className="size-3 shrink-0 rounded-full border-2 border-accent" />
                </div>
              </div>
            }
          />
          <Tile
            feature="rsvp"
            visual={
              <div className="flex items-center gap-4 font-button text-[0.7rem] font-semibold tracking-[0.08em] uppercase">
                <div className="flex flex-col gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-accent-contrast">
                    <IconCheck size={16} stroke={2} />
                    {invitation.sections.rsvp.form.yes}
                  </span>
                  <span className="rounded-full border border-white/25 px-4 py-2.5 text-center text-muted">
                    {invitation.sections.rsvp.form.no}
                  </span>
                </div>
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-accent-contrast">
                  <IconBrandWhatsapp size={30} stroke={1.5} />
                </span>
              </div>
            }
          />
          <Tile
            feature="dashboard"
            visual={
              <ul className="w-full max-w-72 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0c111c] px-4 py-1 font-button text-sm">
                {[
                  [firstGuest, guests.status.confirmed, 'bg-emerald-400/15 text-emerald-200'],
                  [secondGuest, guests.status.confirmed, 'bg-emerald-400/15 text-emerald-200'],
                  [thirdGuest, guests.status.whatsapp, 'bg-amber-400/15 text-amber-200'],
                  [fourthGuest, guests.status.opened, 'bg-sky-400/15 text-sky-200'],
                ].map(([name, status, tone]) => (
                  <li key={name} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-ink">{name}</span>
                    <span className={cn(chip, tone)}>{status}</span>
                  </li>
                ))}
              </ul>
            }
          />
          <SmallTile feature="countdown" icon={<IconHourglassHigh {...iconProps} />} />
          <SmallTile feature="gallery" icon={<IconPhoto {...iconProps} />} />
          <SmallTile feature="schedule" icon={<IconMapPin {...iconProps} />} />
          <SmallTile feature="rules" icon={<IconMoodHappy {...iconProps} />} />
          <SmallTile feature="dressCode" icon={<IconHanger {...iconProps} />} />
          <SmallTile feature="gifts" icon={<IconGift {...iconProps} />} />
          <SmallTile feature="saveTheDate" icon={<IconCalendarHeart {...iconProps} />} />
          <SmallTile feature="light" icon={<IconBolt {...iconProps} />} />
        </ul>
      </div>
    </section>
  );
}
