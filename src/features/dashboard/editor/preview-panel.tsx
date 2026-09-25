'use client';

import { IconDeviceMobile, IconExternalLink, IconMail, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { buttonClasses } from '@/components/dashboard/styles';
import { editor } from '@/i18n/pt-AO';

import {
  PREVIEW_REFRESH,
  PREVIEW_UPDATED,
  type PreviewMessage,
  previewMessageVersion,
} from './preview-messages';

const t = editor.preview;

/** The preview renders at a phone's size, then scales down to fit the column. */
const PHONE = { width: 390, height: 844 };
const DESKTOP_QUERY = '(min-width: 1024px)';

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

interface FrameProps {
  src: string;
  /** Increments when the draft changed: the frame then re-renders itself. */
  version: number;
  onUpdating: (updating: boolean) => void;
  /** Scale the phone-sized page down to the available width (desktop column). */
  scaled: boolean;
}

function PreviewFrame({ src, version, onUpdating, scaled }: FrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const latest = useRef(version);

  const requestRefresh = useCallback(() => {
    const message: PreviewMessage = { type: PREVIEW_REFRESH, version: latest.current };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!scaled || !wrap) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, wrap.clientWidth / PHONE.width));
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [scaled]);

  useEffect(() => {
    latest.current = version;
    if (version === 0) return;
    onUpdating(true);
    requestRefresh();
  }, [version, onUpdating, requestRefresh]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const shown = previewMessageVersion(event, PREVIEW_UPDATED);
      if (shown === null) return;
      // Behind: the request was lost (sent while the page was loading) or a newer draft exists.
      if (shown < latest.current) requestRefresh();
      else onUpdating(false);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onUpdating, requestRefresh]);

  if (!scaled) {
    return <iframe ref={frameRef} src={src} title={t.frameTitle} className="size-full border-0" />;
  }
  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-4xl border-8 border-stone-800 bg-white shadow-xl"
      style={{ height: PHONE.height * scale + 16 }}
    >
      <iframe
        ref={frameRef}
        src={src}
        title={t.frameTitle}
        className="border-0"
        style={{
          width: PHONE.width,
          height: PHONE.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}

interface PreviewPanelProps {
  eventId: string;
  version: number;
  /** The last draft could not be stored: the preview shows the saved version. */
  stale: boolean;
}

/**
 * The live preview: a phone frame beside the editor on large screens; on phones a button opens it
 * full screen. Both load the real invitation page (/previsualizar/…) in a same-origin iframe.
 */
export function PreviewPanel({ eventId, version, stale }: PreviewPanelProps) {
  const isDesktop = useIsDesktop();
  const [envelope, setEnvelope] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const src = `/previsualizar/${eventId}${envelope ? '?envelope=1' : ''}`;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setEnvelope((shown) => !shown)}
        aria-pressed={envelope}
        className={buttonClasses('secondary', 'sm')}
      >
        <IconMail size={16} stroke={1.75} aria-hidden="true" />
        {envelope ? t.hideEnvelope : t.showEnvelope}
      </button>
      <a href={src} target="_blank" rel="noopener" className={buttonClasses('ghost', 'sm')}>
        <IconExternalLink size={16} stroke={1.75} aria-hidden="true" />
        {t.openNewWindow}
      </a>
    </div>
  );

  const status = (
    <p className="min-h-5 font-sans text-xs text-stone-600" aria-live="polite">
      {stale ? t.stale : updating ? t.updating : null}
    </p>
  );

  if (isDesktop) {
    return (
      <section aria-label={t.title} className="flex flex-col gap-3">
        <div>
          <h2 className="font-sans text-sm font-semibold text-stone-900">{t.title}</h2>
          <p className="font-sans text-xs text-stone-600">{t.hint}</p>
        </div>
        {controls}
        <PreviewFrame src={src} version={version} onUpdating={setUpdating} scaled />
        {status}
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDialogOpen(true);
          dialogRef.current?.showModal();
        }}
        className={buttonClasses('primary', 'md', 'fixed right-4 bottom-4 z-40 shadow-lg')}
      >
        <IconDeviceMobile size={18} stroke={1.75} aria-hidden="true" />
        {t.open}
      </button>
      <dialog
        ref={dialogRef}
        aria-label={t.title}
        onClose={() => setDialogOpen(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-stone-100 p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2">
            {controls}
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t.close}
              className={buttonClasses('ghost', 'icon')}
            >
              <IconX size={20} stroke={1.75} aria-hidden="true" />
            </button>
          </div>
          <div className="px-3">{status}</div>
          <div className="min-h-0 flex-1">
            {dialogOpen ? (
              <PreviewFrame src={src} version={version} onUpdating={setUpdating} scaled={false} />
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
