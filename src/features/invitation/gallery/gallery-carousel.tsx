'use client';

import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { fillTemplate } from '@/lib/template';

import { MediaImage } from '../media-image';

import styles from './gallery.module.css';

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;

export interface GalleryPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Uploaded photos: widths of their processed files. */
  widths?: number[];
}

export interface GalleryLabels {
  /** "{n}" placeholders. */
  openPhoto: string;
  previous: string;
  next: string;
  close: string;
  /** "{n} de {total}" */
  counter: string;
  dialog: string;
}

/** Slide width in % of the carousel; keep in sync with `.slide` in gallery.module.css. */
const SLIDE_WIDTH = 62;
/** How much smaller each step away from the centre gets, and how far it slides inwards (%). */
const SCALE_STEP = 0.22;
const PULL = 18;

/** Transform of a photo `distance` slides away from the centre (negative = to the left). */
function coverflow(distance: number): { transform: string; zIndex: number } {
  const steps = Math.min(Math.abs(distance), 2);
  const shift = -Math.sign(distance) * steps * PULL;
  return {
    transform: `translateX(${shift.toFixed(2)}%) scale(${(1 - steps * SCALE_STEP).toFixed(3)})`,
    zIndex: 10 - Math.round(steps * 3),
  };
}

/** Embla starts once the gallery is this close to the screen. */
const START_MARGIN = '100% 0px';

/**
 * Coverflow carousel (Embla): swipe between photos, tap the centre photo for the full-screen
 * lightbox. The first frame is laid out on the server (no jump when the script arrives).
 *
 * Embla measures the page when it starts, which makes the browser lay out everything around it
 * at once (hundreds of milliseconds on a slow phone, while the page loads). So it only starts
 * when the gallery comes near the screen; until then a tap opens the lightbox directly.
 */
export function GalleryCarousel({
  photos,
  labels,
}: {
  photos: GalleryPhoto[];
  labels: GalleryLabels;
}) {
  const startIndex = photos.length >= 3 ? 1 : 0;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    startIndex,
  });
  const viewport = useRef<HTMLDivElement>(null);
  const frames = useRef<(HTMLButtonElement | null)[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        emblaRef(element);
      },
      { rootMargin: START_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [emblaRef]);

  const applyCoverflow = useCallback((api: EmblaApi) => {
    const progress = api.scrollProgress();
    const snaps = api.scrollSnapList();
    const steps = Math.max(snaps.length - 1, 1);
    snaps.forEach((snap, index) => {
      const frame = frames.current[index];
      if (!frame) return;
      const { transform, zIndex } = coverflow((snap - progress) * steps);
      frame.style.transform = transform;
      if (frame.parentElement) frame.parentElement.style.zIndex = String(zIndex);
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    applyCoverflow(emblaApi);
    emblaApi.on('scroll', applyCoverflow).on('reInit', applyCoverflow);
    return () => {
      emblaApi.off('scroll', applyCoverflow).off('reInit', applyCoverflow);
    };
  }, [emblaApi, applyCoverflow]);

  function onFrameClick(index: number) {
    if (emblaApi && emblaApi.selectedScrollSnap() !== index) {
      emblaApi.scrollTo(index);
      return;
    }
    setOpenIndex(index);
  }

  // Server-side first frame: the start photo centred, its neighbours already in place.
  const initialOffset = 50 - (startIndex + 0.5) * SLIDE_WIDTH;

  return (
    <>
      <div className={styles.viewport} ref={viewport}>
        <div
          className={styles.container}
          style={{ transform: `translate3d(${initialOffset}%, 0, 0)` }}
        >
          {photos.map((photo, index) => {
            const { transform, zIndex } = coverflow(index - startIndex);
            return (
              <div key={photo.src} className={styles.slide} style={{ zIndex }}>
                <button
                  type="button"
                  ref={(node) => {
                    frames.current[index] = node;
                  }}
                  className={styles.frame}
                  style={{ transform }}
                  onClick={() => onFrameClick(index)}
                  aria-label={fillTemplate(labels.openPhoto, { n: String(index + 1) })}
                >
                  <span className={styles.photo}>
                    <MediaImage
                      src={photo.src}
                      widths={photo.widths}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 480px) 62vw, 300px"
                      className="object-cover"
                    />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {openIndex !== null ? (
        <Lightbox
          photos={photos}
          startIndex={openIndex}
          labels={labels}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  photos,
  startIndex,
  labels,
  onClose,
}: {
  photos: GalleryPhoto[];
  startIndex: number;
  labels: GalleryLabels;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewportRef, emblaApi] = useEmblaCarousel({ align: 'center', startIndex });
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    dialogRef.current?.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = (api: EmblaApi) => setIndex(api.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      aria-label={labels.dialog}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') emblaApi?.scrollPrev();
        if (event.key === 'ArrowRight') emblaApi?.scrollNext();
      }}
    >
      <button
        type="button"
        className={styles.lightboxButton}
        style={{ top: '1rem', right: '1rem' }}
        onClick={() => dialogRef.current?.close()}
        aria-label={labels.close}
      >
        <IconX size={26} stroke={1.75} aria-hidden="true" />
      </button>
      <div className={styles.lightboxViewport} ref={viewportRef}>
        <div className={styles.lightboxContainer}>
          {photos.map((photo, photoIndex) => (
            <div
              key={photo.src}
              className={styles.lightboxSlide}
              aria-hidden={photoIndex === index ? undefined : true}
            >
              <div className={styles.lightboxPhoto}>
                <MediaImage
                  src={photo.src}
                  widths={photo.widths}
                  alt={photo.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p
        aria-live="polite"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-sm tracking-wider text-white/85"
      >
        {fillTemplate(labels.counter, { n: String(index + 1), total: String(photos.length) })}
      </p>
      <button
        type="button"
        className={styles.lightboxButton}
        style={{ left: '0.75rem', bottom: '1rem' }}
        onClick={() => emblaApi?.scrollPrev()}
        disabled={index === 0}
        aria-label={labels.previous}
      >
        <IconChevronLeft size={26} stroke={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.lightboxButton}
        style={{ right: '0.75rem', bottom: '1rem' }}
        onClick={() => emblaApi?.scrollNext()}
        disabled={index === photos.length - 1}
        aria-label={labels.next}
      >
        <IconChevronRight size={26} stroke={1.75} aria-hidden="true" />
      </button>
    </dialog>
  );
}
