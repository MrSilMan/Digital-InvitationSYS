'use client';

import { IconVolume, IconVolumeOff } from '@tabler/icons-react';
import { useAnimate } from 'motion/react-mini';
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { Monogram } from '@/components/ui/monogram';
import { cn } from '@/lib/cn';

import { EARLY_TAP_FLAG, OPENED_ATTRIBUTE } from './constants';
import styles from './opening.module.css';

interface OpeningScreenProps {
  /** sessionStorage key that remembers the envelope was opened in this tab. */
  storageKey: string;
  monogram: string;
  /** "Braúlio e Nanda" */
  couple: string;
  guestName: string;
  music: { src: string; mimeType: string } | null;
  /** The theme's florals for the opening screen (rendered on the server). */
  decorations: ReactNode;
  /** Invitation content: kept out of reach (focus, screen readers) while the envelope is shown. */
  contentId: string;
  /** Gets the focus once the envelope has opened. */
  headingId: string;
  labels: {
    addressedTo: string;
    tapToOpen: string;
    openButton: string;
    play: string;
    pause: string;
  };
}

/** A wax blob: a circle with a slightly irregular edge (deterministic, same on server and client). */
const SEAL_PATH = (() => {
  const points = 72;
  const commands: string[] = [];
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const radius = 46 + 2.4 * Math.sin(angle * 7) + 1.5 * Math.sin(angle * 13 + 1.3);
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    commands.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${commands.join(' ')} Z`;
})();

const noSubscription = () => () => {};

function wasOpened(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function rememberOpened(key: string): void {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // Private mode or storage disabled: the envelope simply shows again next time.
  }
}

/**
 * The closed envelope over the invitation: tapping it opens it (Motion, WAAPI-based mini API) and
 * starts the music, which browsers only allow after a tap. A floating button then mutes and
 * unmutes. Respects prefers-reduced-motion (a plain fade instead of the animation).
 */
export function OpeningScreen({
  storageKey,
  monogram,
  couple,
  guestName,
  music,
  decorations,
  contentId,
  headingId,
  labels,
}: OpeningScreenProps) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>('closed');
  // Server and hydration: closed. Right after hydration: the tab's memory.
  const alreadyOpened = useSyncExternalStore(
    noSubscription,
    () => wasOpened(storageKey),
    () => false,
  );
  const isOpen = phase === 'open' || alreadyOpened;

  const [scope, animate] = useAnimate<HTMLDivElement>();
  const sealRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<SVGSVGElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsMusic = useRef(false);
  const [playing, setPlaying] = useState(false);
  const gradientId = useId();
  const addresseeId = useId();

  // While the envelope is closed: no scrolling, and the invitation behind it is inert.
  useEffect(() => {
    const root = document.documentElement;
    if (isOpen || root.hasAttribute(OPENED_ATTRIBUTE)) return;
    const content = document.getElementById(contentId);
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    content?.setAttribute('inert', '');
    return () => {
      root.style.overflow = previousOverflow;
      content?.removeAttribute('inert');
    };
  }, [isOpen, contentId]);

  // Pause when the guest switches app or tab; resume when they come back (unless they muted).
  useEffect(() => {
    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) audio.pause();
      else if (wantsMusic.current) void audio.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // A tap before React was ready (recorded by the boot script) opens the envelope now. Browsers
  // still count it as a user gesture for a few seconds, so the music can start too.
  const openAfterEarlyTap = useEffectEvent(() => void open());
  useEffect(() => {
    const flags = window as Window & { [EARLY_TAP_FLAG]?: boolean };
    if (!flags[EARLY_TAP_FLAG]) return;
    const timer = setTimeout(() => {
      flags[EARLY_TAP_FLAG] = false;
      openAfterEarlyTap();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function playMusic() {
    wantsMusic.current = true;
    void audioRef.current?.play().catch(() => {});
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      playMusic();
    } else {
      wantsMusic.current = false;
      audio.pause();
    }
  }

  async function open() {
    if (phase !== 'closed') return;
    setPhase('opening');
    rememberOpened(storageKey);
    // Must start inside the tap: browsers block audio that starts later on its own.
    playMusic();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      const seal = sealRef.current;
      const flap = flapRef.current;
      const letter = letterRef.current;
      if (!reducedMotion && seal && flap && letter) {
        await animate(
          seal,
          { transform: ['scale(1)', 'scale(1.12)', 'scale(0)'], opacity: [1, 1, 0] },
          { duration: 0.5, ease: 'easeIn' },
        );
        await animate(
          flap,
          { transform: ['rotateX(0deg)', 'rotateX(180deg)'] },
          { duration: 0.6, ease: [0.45, 0, 0.2, 1] },
        );
        // Open flap goes behind the letter, which now slides out.
        flap.style.zIndex = '-1';
        await animate(
          letter,
          { transform: ['translateY(0%)', 'translateY(-40%)'] },
          { duration: 0.65, ease: 'easeOut' },
        );
      }
      if (scope.current) {
        await animate(
          scope.current,
          { opacity: [1, 0] },
          { duration: reducedMotion ? 0.25 : 0.55 },
        );
      }
    } finally {
      setPhase('open');
      document.getElementById(headingId)?.focus({ preventScroll: true });
    }
  }

  return (
    <>
      {isOpen ? null : (
        <div ref={scope} data-opening-screen="" className={cn(styles.overlay, 'theme-surface')}>
          {decorations}
          <div className={styles.panel}>
            <p className="text-center font-script text-[clamp(2.8rem,14cqi,3.8rem)] leading-tight text-script">
              {couple}
            </p>
            <button
              type="button"
              data-opening-envelope=""
              className={styles.envelope}
              onClick={open}
              aria-label={labels.openButton}
              aria-describedby={addresseeId}
              disabled={phase !== 'closed'}
            >
              <div className={styles.back} />
              <div ref={letterRef} className={styles.letter}>
                <Monogram initials={monogram} className="text-[clamp(1.8rem,9cqi,2.4rem)]" />
                <span className="font-script text-[clamp(1.6rem,8cqi,2.2rem)] leading-tight text-script">
                  {couple}
                </span>
              </div>
              <svg
                className={styles.pocket}
                viewBox="0 0 142 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path className={cn(styles.fold, styles.foldSide)} d="M0 0 L66 55 L0 100 Z" />
                <path className={cn(styles.fold, styles.foldSide)} d="M142 0 L76 55 L142 100 Z" />
                <path className={styles.fold} d="M0 100 L71 45 L142 100 Z" />
              </svg>
              <p id={addresseeId} className={cn(styles.address, 'font-caps')}>
                <span className="block text-[clamp(0.7rem,3.4cqi,0.9rem)] tracking-[0.16em] text-muted">
                  {labels.addressedTo}
                </span>
                <span className="block text-[clamp(0.95rem,4.6cqi,1.2rem)] font-bold tracking-[0.04em] text-balance text-ink uppercase">
                  {guestName}
                </span>
              </p>
              <svg
                ref={flapRef}
                className={styles.flap}
                viewBox="0 0 142 57"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path className={styles.fold} d="M0 0 L142 0 L71 57 Z" />
              </svg>
              <div ref={sealRef} className={styles.seal}>
                <svg className={styles.sealShape} viewBox="0 0 100 100" aria-hidden="true">
                  <defs>
                    <radialGradient id={gradientId} cx="38%" cy="34%" r="70%">
                      <stop
                        offset="0%"
                        style={{ stopColor: 'var(--theme-seal-ink)', stopOpacity: 0.55 }}
                      />
                      <stop offset="30%" style={{ stopColor: 'var(--theme-seal)' }} />
                      <stop
                        offset="100%"
                        style={{ stopColor: 'color-mix(in srgb, var(--theme-seal) 70%, #000)' }}
                      />
                    </radialGradient>
                  </defs>
                  <path d={SEAL_PATH} fill={`url(#${gradientId})`} />
                  <circle
                    cx="50"
                    cy="50"
                    r="33"
                    fill="none"
                    strokeWidth="2.2"
                    style={{
                      stroke: 'color-mix(in srgb, var(--theme-seal) 60%, #000)',
                      opacity: 0.45,
                    }}
                  />
                </svg>
                <Monogram
                  initials={monogram}
                  className="relative text-[clamp(1.4rem,7.5cqi,2rem)]"
                  style={{ color: 'var(--theme-seal-ink)' }}
                />
              </div>
            </button>
            <p
              aria-hidden="true"
              className={cn(styles.tap, 'font-caps text-[clamp(1rem,4.8cqi,1.25rem)]')}
            >
              {labels.tapToOpen}
            </p>
          </div>
        </div>
      )}
      {music ? (
        <>
          <audio
            ref={audioRef}
            loop
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src={music.src} type={music.mimeType} />
          </audio>
          {isOpen ? (
            <button
              type="button"
              onClick={toggleMusic}
              aria-label={playing ? labels.pause : labels.play}
              className={cn(styles.music, 'bg-accent text-accent-contrast')}
            >
              {playing ? (
                <IconVolume size={24} stroke={1.75} aria-hidden="true" />
              ) : (
                <IconVolumeOff size={24} stroke={1.75} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </>
      ) : null}
    </>
  );
}
