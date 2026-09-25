'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { type FieldErrors, FormProvider, type Path, useForm } from 'react-hook-form';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { formatTime } from '@/i18n/format';
import { auth, editor } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import {
  type EventEditorData,
  type EventEditorValues,
  eventEditorSchema,
} from '@/lib/validation/event-editor';

import { MediaTab } from '../media/media-tab';
import type { MediaItem } from '../media/types';

import { discardPreviewDraft, type EditorErrorCode, saveEvent } from './actions';
import { PreviewPanel } from './preview-panel';
import { CoupleTab } from './tab-couple';
import { DateVenuesTab } from './tab-date-venues';
import { GeneralTab } from './tab-general';
import { RulesTab, TimelineTab } from './tab-lists';
import { RsvpTab } from './tab-rsvp';
import { DressCodeTab, GiftsTab, MessageTab } from './tab-texts';
import { usePreviewDraft } from './use-preview-draft';

const t = editor;

type TabId = keyof typeof editor.tabs;

interface TabContext {
  eventId: string;
  media: MediaItem[];
  onMediaPublished: () => void;
}

const TABS: {
  id: TabId;
  /** Form fields shown in the tab (error badges, jumping to the first error). */
  fields: (keyof EventEditorValues)[];
  content: (context: TabContext) => ReactNode;
}[] = [
  {
    id: 'general',
    fields: ['phase', 'themeId', 'colors', 'sections'],
    content: () => <GeneralTab />,
  },
  {
    id: 'couple',
    fields: [
      'groomName',
      'brideName',
      'groomParents',
      'brideParents',
      'monogram',
      'introLine',
      'invitationLine',
      'celebrationLine',
      'infoBoxText',
    ],
    content: () => <CoupleTab />,
  },
  {
    id: 'dateVenues',
    fields: ['date', 'startTime', 'endTime', 'venues'],
    content: () => <DateVenuesTab />,
  },
  { id: 'timeline', fields: ['timeline'], content: () => <TimelineTab /> },
  { id: 'message', fields: ['coupleMessage'], content: () => <MessageTab /> },
  {
    id: 'dressCode',
    fields: ['dressCodeText', 'dressCodeColors'],
    content: () => <DressCodeTab />,
  },
  { id: 'rules', fields: ['rules'], content: () => <RulesTab /> },
  {
    id: 'gifts',
    fields: ['giftText', 'giftIban', 'giftAccountHolder'],
    content: () => <GiftsTab />,
  },
  {
    id: 'rsvp',
    fields: ['rsvpMode', 'groomWhatsapp', 'brideWhatsapp', 'rsvpDeadline'],
    content: () => <RsvpTab />,
  },
  {
    id: 'media',
    fields: [],
    content: ({ eventId, media, onMediaPublished }) => (
      <MediaTab eventId={eventId} initialItems={media} onPublished={onMediaPublished} />
    ),
  },
];

/** Leaf errors under a value (a list with three invalid fields counts three). */
function countErrors(value: unknown): number {
  if (typeof value !== 'object' || value === null) return 0;
  if ('message' in value && typeof (value as { message?: unknown }).message === 'string') return 1;
  return Object.values(value).reduce<number>((total, child) => total + countErrors(child), 0);
}

const SAVE_ERRORS: Record<EditorErrorCode, string> = {
  invalid: t.save.errors.invalid,
  unauthenticated: t.save.errors.unauthenticated,
  'not-found': t.save.errors.notFound,
  'rate-limited': t.save.errors.rateLimited,
  unavailable: t.save.errors.unavailable,
};

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: string }
  | { kind: 'error'; code: EditorErrorCode };

interface EventEditorProps {
  eventId: string;
  initialValues: EventEditorValues;
  initialMedia: MediaItem[];
}

/**
 * The event editor: every field of the invitation, in tabs, with the live preview beside it.
 * Nothing reaches guests until "Guardar alterações"; the preview shows unsaved changes. Media
 * are the exception: saved on upload, live once processed ("Multimédia").
 */
export function EventEditor({ eventId, initialValues, initialMedia }: EventEditorProps) {
  const [saved, setSaved] = useState(initialValues);
  const form = useForm<EventEditorValues, unknown, EventEditorData>({
    resolver: zodResolver(eventEditorSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });
  const {
    handleSubmit,
    getValues,
    reset,
    setError,
    control,
    formState: { isDirty, errors },
  } = form;
  const [tab, setTab] = useState<TabId>('general');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [previewVersion, setPreviewVersion] = useState(0);
  const [previewStale, setPreviewStale] = useState(false);

  const refreshPreview = useCallback(() => {
    setPreviewStale(false);
    setPreviewVersion((version) => version + 1);
  }, []);
  const { markSynced } = usePreviewDraft({
    eventId,
    control,
    initial: initialValues,
    onSynced: refreshPreview,
    onFailed: () => setPreviewStale(true),
  });

  // The browser asks before leaving the page with unsaved changes; links to other pages of the
  // app (the event menu, "Os meus convites") navigate without unloading, so they ask here. The
  // capture listener runs before Next.js' Link, and stopping the click keeps the page.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return;
      if (link.origin !== window.location.origin || link.pathname === window.location.pathname) {
        return;
      }
      if (window.confirm(t.save.leaveWarning)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [isDirty]);

  const showFirstError = (formErrors: FieldErrors<EventEditorValues>) => {
    const first = TABS.find((candidate) => candidate.fields.some((field) => field in formErrors));
    if (!first) return;
    setTab(first.id);
    requestAnimationFrame(() => {
      document
        .getElementById(`painel-${first.id}`)
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  };

  const onValid = async () => {
    setStatus({ kind: 'saving' });
    const values = getValues();
    markSynced(values);
    try {
      const result = await saveEvent(eventId, values);
      if (result.ok) {
        reset(result.values);
        markSynced(result.values);
        setSaved(result.values);
        setStatus({ kind: 'saved', at: result.savedAt });
        refreshPreview();
        return;
      }
      for (const issue of result.issues ?? []) {
        setError(issue.path as Path<EventEditorValues>, { message: issue.message });
      }
      setStatus({ kind: 'error', code: result.error });
      if (result.issues?.length) showFirstError(form.formState.errors);
    } catch {
      setStatus({ kind: 'error', code: 'unavailable' });
    }
  };

  const onInvalid = (formErrors: FieldErrors<EventEditorValues>) => {
    setStatus({ kind: 'error', code: 'invalid' });
    showFirstError(formErrors);
  };

  const discard = async () => {
    if (!window.confirm(t.save.discardConfirm)) return;
    reset(saved);
    markSynced(saved);
    setStatus({ kind: 'idle' });
    await discardPreviewDraft(eventId).catch(() => undefined);
    refreshPreview();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = TABS.findIndex((candidate) => candidate.id === tab);
    const next = TABS[(index + step + TABS.length) % TABS.length];
    if (!next) return;
    setTab(next.id);
    document.getElementById(`separador-${next.id}`)?.focus();
  };

  const statusText =
    status.kind === 'saving'
      ? t.save.saving
      : status.kind === 'error'
        ? SAVE_ERRORS[status.code]
        : isDirty
          ? t.save.dirty
          : status.kind === 'saved'
            ? fillTemplate(t.save.savedAt, { time: formatTime(new Date(status.at)) })
            : t.save.clean;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onValid, onInvalid)}
        noValidate
        className="mx-auto max-w-7xl px-4 pb-24 lg:pb-10"
      >
        <div className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-100/95 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-sans text-lg font-semibold text-stone-900">{t.title}</h1>
              <p
                role="status"
                className={cn(
                  'font-sans text-sm',
                  status.kind === 'error' ? 'text-red-700' : 'text-stone-600',
                )}
              >
                {statusText}
                {status.kind === 'error' && status.code === 'unauthenticated' ? (
                  <>
                    {' '}
                    <Link
                      href={`/entrar?voltar=${encodeURIComponent(`/painel/eventos/${eventId}/editar`)}`}
                      className="underline"
                    >
                      {auth.login.title}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty ? (
              <button type="button" onClick={discard} className={buttonClasses('ghost')}>
                {t.save.discard}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={status.kind === 'saving' || !isDirty}
              className={buttonClasses('primary')}
            >
              {status.kind === 'saving' ? t.save.saving : t.save.save}
            </button>
          </div>
        </div>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div
              role="tablist"
              aria-label={t.tabsLabel}
              onKeyDown={onTabKeyDown}
              className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pt-2 pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
            >
              {TABS.map((candidate) => {
                const selected = candidate.id === tab;
                const count = candidate.fields.reduce(
                  (total, field) => total + countErrors(errors[field]),
                  0,
                );
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    role="tab"
                    id={`separador-${candidate.id}`}
                    aria-selected={selected}
                    aria-controls={`painel-${candidate.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(candidate.id)}
                    className={cn(
                      'relative flex shrink-0 items-center rounded-lg px-3 py-2 font-sans text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-stone-900',
                      selected ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200',
                    )}
                  >
                    {t.tabs[candidate.id]}
                    {count > 0 ? (
                      // Positioned over the corner: a badge appearing must not move the tabs.
                      <span
                        className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-xs leading-5 text-white"
                        aria-label={fillTemplate(t.tabErrors, { count: String(count) })}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {TABS.map((candidate) => (
              <div
                key={candidate.id}
                role="tabpanel"
                id={`painel-${candidate.id}`}
                aria-labelledby={`separador-${candidate.id}`}
                hidden={candidate.id !== tab}
                className={`${cardClasses} mt-2 p-5 sm:p-6`}
              >
                {candidate.content({
                  eventId,
                  media: initialMedia,
                  onMediaPublished: refreshPreview,
                })}
              </div>
            ))}
          </div>
          <aside className="lg:sticky lg:top-24">
            <PreviewPanel eventId={eventId} version={previewVersion} stale={previewStale} />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
