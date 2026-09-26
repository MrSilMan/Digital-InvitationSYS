import { IconBellRinging, IconCheck, IconChecks, IconMicrophone } from '@tabler/icons-react';
import Image from 'next/image';

import { Icon } from '@/components/icons';
import { ThemeRoot } from '@/components/theme/theme-root';
import { CornerDecorations } from '@/components/ui/corner-decorations';
import openingStyles from '@/features/invitation/opening/opening.module.css';
import { dateParts, formatDate, formatInvitationWeekdayTime } from '@/i18n/format';
import { formatCount } from '@/i18n/plural';
import { guests, invitation, invitationDefaults } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import type { ThemeDefinition } from '@/themes';

import { LiveCouple, LiveMonogram, LiveName } from './couple-preview';
import { WaxSeal } from './decor';
import { DEMO_PARENTS } from './demo-event';
import styles from './landing.module.css';

/**
 * Small, static versions of the invitation's screens for the landing page's phones: the same
 * theme, fonts, artwork and texts as the real pages, sized in `--u` (1% of the phone screen's
 * width, see PhoneFrame) so they fit any phone (the real sections have rem minimums made for a
 * full screen). Their ThemeRoots are never size containers. Decorative: the phones are
 * `aria-hidden` and captioned. The couple's names come from the "try it" fields
 * (CouplePreviewProvider must be around them).
 */

const COUPLE = invitation.couple;
const COUPLE_SHORT = invitation.coupleShort;

interface ScreenProps {
  theme: ThemeDefinition;
  /** The wedding's date and time. */
  date: Date;
  /** Load the artwork right away (first screen). */
  eager?: boolean;
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="mx-[calc(2*var(--u))] inline-block size-[calc(2*var(--u))] rounded-full bg-accent align-middle"
    />
  );
}

function MiniDate({ date, withWeekday = false }: { date: Date; withWeekday?: boolean }) {
  const { day, month, year } = dateParts(date);
  return (
    <div className="text-center">
      {/* Regular weights only in the examples: each weight is another font file on the hero. */}
      <p className="font-body text-[calc(8.4*var(--u))] leading-none tracking-[0.02em] uppercase">
        {day}
        <Dot />
        {month}
        <Dot />
        {year}
      </p>
      {withWeekday ? (
        <p className="mt-[calc(1.8*var(--u))] font-caps text-[calc(4.5*var(--u))] tracking-wider">
          {formatInvitationWeekdayTime(date)}
        </p>
      ) : null}
    </div>
  );
}

function MiniHero({ theme, eager }: Pick<ScreenProps, 'theme' | 'eager'>) {
  return (
    <Image
      src={theme.hero.src}
      width={theme.hero.width}
      height={theme.hero.height}
      alt=""
      sizes="(max-width: 640px) 45vw, 320px"
      loading={eager ? 'eager' : 'lazy'}
      className="absolute inset-x-0 bottom-0 h-auto w-full"
    />
  );
}

/** The personalised invitation card, addressed to `guestName`. */
export function MiniInvitationCard({
  theme,
  date,
  eager,
  guestName,
}: ScreenProps & { guestName: string }) {
  return (
    <ThemeRoot theme={theme} container={false} className="relative h-full overflow-hidden">
      <CornerDecorations theme={theme} area="invitation" eager={eager} />
      <div className="relative flex flex-col items-center gap-[calc(2.8*var(--u))] px-[calc(6*var(--u))] pt-[calc(14*var(--u))] text-center">
        <LiveMonogram className="text-[calc(20*var(--u))]" />
        <p className="font-caps text-[calc(5.5*var(--u))] tracking-wider">
          {invitationDefaults.introLine}
        </p>
        <div className="grid w-full grid-cols-2 gap-x-[calc(4*var(--u))] font-caps text-[calc(4.1*var(--u))] leading-snug">
          {[DEMO_PARENTS.groom, DEMO_PARENTS.bride].map((names, index) => (
            <p key={index} className={index === 0 ? 'text-right' : 'text-left'}>
              {names.map((name) => (
                <span key={name} className="block">
                  {name}
                </span>
              ))}
            </p>
          ))}
        </div>
        <p className="font-caps text-[calc(5*var(--u))] tracking-wider">
          {invitationDefaults.invitationLine}
        </p>
        <div className="w-full">
          <p className="font-caps text-[calc(6.7*var(--u))] leading-tight font-medium tracking-[0.04em] uppercase">
            {guestName}
          </p>
          <div className="mt-[calc(0.8*var(--u))] flex items-center">
            <span className="size-[calc(2.8*var(--u))] shrink-0 rounded-full border-[calc(0.6*var(--u))] border-accent" />
            <span className="h-0 flex-1 border-t-[calc(0.8*var(--u))] border-dotted border-accent" />
            <span className="size-[calc(2.8*var(--u))] shrink-0 rounded-full border-[calc(0.6*var(--u))] border-accent" />
          </div>
        </div>
        <p className="font-caps text-[calc(4.2*var(--u))] tracking-[0.04em] text-balance">
          {invitationDefaults.celebrationLine}
        </p>
        <p className="font-script text-[calc(14*var(--u))] leading-[1.15] text-balance text-script">
          <LiveCouple template={COUPLE} />
        </p>
        <MiniDate date={date} withWeekday />
      </div>
      <MiniHero theme={theme} eager={eager} />
    </ThemeRoot>
  );
}

/** The Save the Date page, with the theme's button shape. */
export function MiniSaveTheDate({ theme, date, eager }: ScreenProps) {
  const circle = theme.buttonShape === 'circle';
  return (
    <ThemeRoot theme={theme} container={false} className="relative h-full overflow-hidden">
      <CornerDecorations theme={theme} area="saveTheDate" eager={eager} />
      <div className="relative flex flex-col items-center gap-[calc(4*var(--u))] px-[calc(6*var(--u))] pt-[calc(16*var(--u))] text-center">
        <LiveMonogram className="text-[calc(22*var(--u))]" />
        <div>
          <p className="font-caps text-[calc(12*var(--u))] leading-none font-medium tracking-[0.02em] uppercase">
            {invitation.saveTheDate.title}
          </p>
          <p className="mt-[calc(1.6*var(--u))] font-body text-[calc(7.4*var(--u))] font-medium">
            {invitation.saveTheDate.subtitle}
          </p>
        </div>
        <p className="flex items-center justify-center gap-[0.3em] font-script text-[calc(13.8*var(--u))] leading-tight text-script">
          <LiveName who="groom" />
          <Icon name="rings" size="0.8em" stroke={1.25} className="shrink-0 text-accent" />
          <LiveName who="bride" />
        </p>
        <MiniDate date={date} />
        <span
          className={cn(
            'inline-flex items-center justify-center bg-accent font-button tracking-[0.06em] text-accent-contrast uppercase shadow-[0_6px_14px_-8px_rgb(0_0_0/0.55)]',
            circle
              ? 'size-[calc(29*var(--u))] flex-col gap-[calc(1*var(--u))] rounded-full text-[calc(3.2*var(--u))] leading-tight'
              : 'gap-[calc(2*var(--u))] rounded-full px-[calc(6.5*var(--u))] py-[calc(3*var(--u))] text-[calc(4*var(--u))]',
          )}
        >
          <Icon
            name="check-circle"
            size="1em"
            stroke={1.75}
            className={circle ? 'text-[calc(7*var(--u))]' : 'text-[calc(6*var(--u))]'}
          />
          <span>
            {invitation.buttons.confirmAttendance.regular}{' '}
            <strong>{invitation.buttons.confirmAttendance.bold}</strong>
          </span>
        </span>
        <p className="font-body text-[calc(5.5*var(--u))]">
          {invitation.saveTheDate.officialInviteSoon}
        </p>
      </div>
      <MiniHero theme={theme} eager={eager} />
    </ThemeRoot>
  );
}

/** The closed envelope of the opening screen. `sealId` must be unique on the page. */
export function MiniEnvelope({
  theme,
  guestName,
  sealId,
  eager,
}: Pick<ScreenProps, 'theme' | 'eager'> & { guestName: string; sealId: string }) {
  return (
    <ThemeRoot
      theme={theme}
      container={false}
      className="relative flex h-full flex-col items-center justify-center gap-[calc(8*var(--u))] overflow-hidden px-[calc(7*var(--u))]"
    >
      <CornerDecorations theme={theme} area="opening" eager={eager} />
      <p className="relative text-center font-script text-[calc(15*var(--u))] leading-tight text-script">
        <LiveCouple template={COUPLE} />
      </p>
      <div className="relative aspect-[1.42] w-full">
        <div className={openingStyles.back} />
        <svg
          className={openingStyles.pocket}
          viewBox="0 0 142 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className={cn(openingStyles.fold, openingStyles.foldSide)}
            d="M0 0 L66 55 L0 100 Z"
          />
          <path
            className={cn(openingStyles.fold, openingStyles.foldSide)}
            d="M142 0 L76 55 L142 100 Z"
          />
          <path className={openingStyles.fold} d="M0 100 L71 45 L142 100 Z" />
        </svg>
        <p className={cn(openingStyles.address, 'font-caps')}>
          <span className="block text-[calc(3.8*var(--u))] tracking-[0.16em] text-muted">
            {invitation.opening.addressedTo}
          </span>
          <span className="block text-[calc(5.2*var(--u))] font-bold tracking-[0.04em] text-ink uppercase">
            {guestName}
          </span>
        </p>
        <svg
          className={openingStyles.flap}
          viewBox="0 0 142 57"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className={openingStyles.fold} d="M0 0 L142 0 L71 57 Z" />
        </svg>
        <WaxSeal
          gradientId={sealId}
          className="absolute top-[57%] left-1/2 z-4 w-[22%] -translate-x-1/2 -translate-y-1/2"
        >
          <LiveMonogram
            className="text-[calc(8*var(--u))]"
            style={{ color: 'var(--theme-seal-ink)' }}
          />
        </WaxSeal>
      </div>
      <p
        className={cn(
          styles.pulse,
          'relative font-caps text-[calc(5.6*var(--u))] tracking-[0.12em]',
        )}
      >
        {invitation.opening.tapToOpen}
      </p>
    </ThemeRoot>
  );
}

/** Two small opposite florals, like the corners of the real link preview image. */
function PreviewCorners({ theme }: Pick<ScreenProps, 'theme'>) {
  const corner = theme.images.corner;
  if (!corner) return null;
  const image = { src: corner.src, width: corner.width, height: corner.height, sizes: '90px' };
  return (
    <>
      <Image {...image} alt="" className="absolute top-[-14%] left-[-5%] h-auto w-[30%]" />
      <Image
        {...image}
        alt=""
        className="absolute right-[-5%] bottom-[-14%] h-auto w-[30%] -scale-100"
      />
    </>
  );
}

interface ChatProps extends Pick<ScreenProps, 'theme' | 'date'> {
  guestName: string;
  /** The personal link as shown in the message, e.g. "convites.ao/c/braulio-e-nanda/…". */
  linkText: string;
  labels: { time: string; online: string; reply: string };
}

/**
 * The WhatsApp message a guest receives: the dashboard's suggested text and the link preview
 * (the theme's paper, monogram and names, like the real preview image).
 */
export function MiniWhatsappChat({ theme, date, guestName, linkText, labels }: ChatProps) {
  // The couple's names stay placeholders for LiveCouple; everything else is filled in here.
  const message = fillTemplate(guests.template.defaults.INVITATION, {
    convidado: guestName,
    data: formatDate(date),
    link: linkText,
    noivos: COUPLE,
  });
  const [beforeLink = '', afterLink = ''] = message.split(linkText);
  const previewTitle = fillTemplate(invitation.metadata.invitationTitle, { couple: COUPLE_SHORT });
  const previewText = fillTemplate(invitation.metadata.description, { date: formatDate(date) });

  return (
    <div className="flex h-full flex-col bg-[#efeae2] text-left font-sans text-[#111b21]">
      <div className="flex items-center gap-[calc(3*var(--u))] bg-[#008069] px-[calc(4*var(--u))] pt-[calc(12*var(--u))] pb-[calc(3*var(--u))] text-white">
        <ThemeRoot
          theme={theme}
          container={false}
          className="grid size-[calc(13*var(--u))] shrink-0 place-items-center rounded-full"
        >
          <LiveMonogram className="text-[calc(6.5*var(--u))]" />
        </ThemeRoot>
        <div className="min-w-0">
          <p className="truncate text-[calc(5.4*var(--u))] leading-tight font-semibold">
            <LiveCouple template={COUPLE_SHORT} />
          </p>
          <p className="text-[calc(3.8*var(--u))]">{labels.online}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-[calc(2.5*var(--u))] overflow-hidden p-[calc(3.5*var(--u))]">
        <div className="mr-[8%] rounded-[calc(3*var(--u))] rounded-tl-none bg-white p-[calc(1.6*var(--u))] shadow-[0_1px_1px_rgb(0_0_0/0.12)]">
          <div className="overflow-hidden rounded-[calc(2*var(--u))] bg-[#f0f2f5]">
            <ThemeRoot
              theme={theme}
              container={false}
              className="relative flex aspect-[1.9] flex-col items-center justify-center overflow-hidden text-center"
            >
              <PreviewCorners theme={theme} />
              <LiveMonogram className="relative text-[calc(9*var(--u))]" />
              <p className="relative font-script text-[calc(9*var(--u))] leading-tight text-script">
                <LiveCouple template={COUPLE} />
              </p>
            </ThemeRoot>
            <div className="px-[calc(2.6*var(--u))] py-[calc(2*var(--u))]">
              <p className="text-[calc(4.3*var(--u))] leading-snug font-semibold">
                <LiveCouple template={previewTitle} />
              </p>
              <p className="mt-[calc(0.6*var(--u))] text-[calc(3.7*var(--u))] leading-snug text-[#54656f]">
                {previewText}
              </p>
            </div>
          </div>
          <p className="px-[calc(1*var(--u))] pt-[calc(2*var(--u))] text-[calc(4.2*var(--u))] leading-snug whitespace-pre-line">
            <LiveCouple template={beforeLink} />
            <span className="text-[#027eb5] underline">{linkText}</span>
            <LiveCouple template={afterLink} />
          </p>
          <p className="text-right text-[calc(3.4*var(--u))] text-[#667781]">{labels.time}</p>
        </div>
        <p className="ml-auto flex items-center gap-[calc(1.4*var(--u))] rounded-[calc(3*var(--u))] rounded-tr-none bg-[#d9fdd3] px-[calc(3*var(--u))] py-[calc(1.8*var(--u))] text-[calc(4.2*var(--u))] shadow-[0_1px_1px_rgb(0_0_0/0.12)]">
          {labels.reply}
          <IconChecks className="size-[calc(4*var(--u))] text-[#53bdeb]" aria-hidden="true" />
        </p>
      </div>
      <div className="flex items-center gap-[calc(2*var(--u))] px-[calc(3*var(--u))] pb-[calc(5*var(--u))]">
        <span className="h-[calc(10*var(--u))] flex-1 rounded-full bg-white" />
        <span className="grid size-[calc(10*var(--u))] place-items-center rounded-full bg-[#008069] text-white">
          <IconMicrophone className="size-[calc(5*var(--u))]" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/** The RSVP after the guest's answer, and the notice the couple sees on their dashboard. */
export function MiniRsvpConfirmed({
  theme,
  guestName,
  seats,
  labels,
}: Pick<ScreenProps, 'theme'> & {
  guestName: string;
  seats: number;
  labels: { dashboardTitle: string; dashboardNotice: string };
}) {
  const people = formatCount(seats, invitation.people);
  const rsvp = invitation.sections.rsvp;
  return (
    <ThemeRoot
      theme={theme}
      container={false}
      className="relative flex h-full flex-col items-center justify-center gap-[calc(6*var(--u))] overflow-hidden px-[calc(8*var(--u))] text-center"
    >
      <CornerDecorations theme={theme} area="rsvp" />
      <p className="relative flex flex-col items-center">
        <Icon
          name="check-circle"
          size="1em"
          stroke={1.25}
          className="mb-[calc(1*var(--u))] text-[calc(18*var(--u))] text-accent"
        />
        <span className="font-script text-[calc(16*var(--u))] leading-[1.15] text-script">
          {rsvp.script}
        </span>
        <span className="relative mt-[-0.6em] font-caps text-[calc(6.4*var(--u))] font-medium tracking-[0.06em]">
          {rsvp.caps}
        </span>
      </p>
      <p className="relative font-body text-[calc(6.2*var(--u))] leading-snug font-medium text-balance">
        {fillTemplate(rsvp.form.confirmed, { guest: guestName, people })}
      </p>
      <p className="relative inline-flex items-center gap-[calc(1.6*var(--u))] rounded-full bg-accent px-[calc(5.5*var(--u))] py-[calc(2.8*var(--u))] font-button text-[calc(4*var(--u))] tracking-[0.06em] text-accent-contrast uppercase">
        <IconCheck className="size-[calc(4.4*var(--u))]" aria-hidden="true" />
        {rsvp.form.yes}
      </p>
      <div className="absolute inset-x-[calc(5*var(--u))] bottom-[calc(7*var(--u))] flex items-center gap-[calc(3*var(--u))] rounded-[calc(4*var(--u))] bg-white/95 p-[calc(3.4*var(--u))] text-left font-sans text-stone-900 shadow-[0_12px_28px_-12px_rgb(0_0_0/0.45)] ring-1 ring-black/5">
        <span className="grid size-[calc(12*var(--u))] shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <IconBellRinging className="size-[calc(5.4*var(--u))]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-[calc(3.5*var(--u))] font-semibold tracking-wide text-stone-500 uppercase">
            {labels.dashboardTitle}
          </span>
          <span className="block text-[calc(4.3*var(--u))] leading-snug font-semibold">
            {fillTemplate(labels.dashboardNotice, { guest: guestName, people })}
          </span>
        </span>
      </div>
    </ThemeRoot>
  );
}
