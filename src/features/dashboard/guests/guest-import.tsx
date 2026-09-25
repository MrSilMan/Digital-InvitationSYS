'use client';

import { IconAlertTriangle, IconDownload, IconLoader2 } from '@tabler/icons-react';
import { useEffect, useId, useState } from 'react';

import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { guests } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { IMPORT_LIMITS } from '@/lib/guests/import';
import { fillTemplate } from '@/lib/template';

import { getGuestImport, type ImportErrorCode, startGuestImport } from './import-actions';
import type { GuestImportView } from './types';
import { guestErrorText } from './ui-helpers';

const t = guests.import;
/** How often the dialog asks for news while the worker imports the file. */
const POLL_MS = 1_500;
const MAX_KB = IMPORT_LIMITS.maxBytes / 1024;

function uploadErrorText(error: ImportErrorCode): string {
  switch (error) {
    case 'type':
      return t.errors.type;
    case 'size':
      return fillTemplate(t.errors.size, { max: String(MAX_KB) });
    case 'empty':
      return t.errors.empty;
    default:
      return guestErrorText({ error });
  }
}

function failureText(view: GuestImportView): string {
  switch (view.failure) {
    case 'too-many-rows':
      return fillTemplate(t.failures['too-many-rows'], { max: String(IMPORT_LIMITS.maxRows) });
    case 'limit':
      return fillTemplate(t.failures.limit, {
        count: String(view.wanted ?? 0),
        room: String(view.room ?? 0),
      });
    case null:
      return '';
    default:
      return t.failures[view.failure];
  }
}

/** What the import did, and the rows it could not take. */
function ImportResult({ eventId, view }: { eventId: string; view: GuestImportView }) {
  const lines =
    view.status === 'DONE'
      ? [
          view.imported > 0
            ? fillTemplate(t.imported, { count: String(view.imported) })
            : t.nothingNew,
          view.duplicates > 0 ? fillTemplate(t.duplicates, { count: String(view.duplicates) }) : '',
          view.invalid > 0 ? fillTemplate(t.invalid, { count: String(view.invalid) }) : '',
        ].filter(Boolean)
      : [];

  return (
    <div className="flex flex-col gap-4">
      {view.status === 'FAILED' ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          <IconAlertTriangle
            size={18}
            stroke={1.75}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{failureText(view)}</span>
        </p>
      ) : (
        <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {view.problems.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-stone-900">{t.problems.title}</h3>
          <div className="max-h-72 overflow-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-stone-50 text-xs text-stone-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.problems.row}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.problems.name}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.problems.problem}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {view.problems.map((problem) => (
                  <tr key={problem.row} className="align-top">
                    <td className="px-3 py-2 text-stone-600 tabular-nums">{problem.row}</td>
                    <td className="px-3 py-2 wrap-break-word text-stone-900">
                      {problem.values.nome || '—'}
                    </td>
                    <td className="px-3 py-2 text-stone-700">
                      {problem.kind === 'duplicate'
                        ? t.problems.duplicate
                        : problem.issues.map((issue) => (
                            <span key={issue.column} className="block">
                              <span className="font-medium">{issue.column}</span>: {issue.message}
                            </span>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {view.moreProblems > 0 ? (
            <p className="text-sm text-stone-600">
              {fillTemplate(t.problems.more, { count: String(view.moreProblems) })}
            </p>
          ) : null}
        </div>
      ) : null}
      {view.invalid > 0 ? (
        <div className="flex flex-col items-start gap-1">
          <a
            href={`/painel/eventos/${eventId}/convidados/importacoes/${view.id}/erros`}
            download
            className={buttonClasses('secondary', 'sm')}
          >
            <IconDownload size={16} stroke={1.75} aria-hidden="true" />
            {t.downloadErrors}
          </a>
          <p className="text-xs text-stone-600">{t.downloadErrorsHint}</p>
        </div>
      ) : null}
    </div>
  );
}

type Stage =
  | { kind: 'choose'; error?: string }
  | { kind: 'uploading' }
  | { kind: 'waiting'; view: GuestImportView }
  | { kind: 'finished'; view: GuestImportView };

/**
 * "Importar lista (CSV)": uploads the file, then follows the import (done by the worker) until it
 * finishes. `onImported` reloads the list when guests were added.
 */
export function GuestImport({ eventId, onImported }: { eventId: string; onImported: () => void }) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'choose' });

  const waitingId = stage.kind === 'waiting' ? stage.view.id : null;
  useEffect(() => {
    if (!waitingId) return;
    const timer = setInterval(() => {
      getGuestImport(eventId, waitingId)
        .then((result) => {
          if (!result.ok || result.import.status === 'PENDING') return;
          setStage({ kind: 'finished', view: result.import });
          if (result.import.imported > 0) onImported();
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [eventId, waitingId, onImported]);

  const submit = async () => {
    if (!file) return;
    if (file.size === 0) return setStage({ kind: 'choose', error: t.errors.empty });
    if (file.size > IMPORT_LIMITS.maxBytes) {
      return setStage({ kind: 'choose', error: uploadErrorText('size') });
    }
    setStage({ kind: 'uploading' });
    try {
      const data = new FormData();
      data.set('ficheiro', file);
      const result = await startGuestImport(eventId, data);
      if (!result.ok) return setStage({ kind: 'choose', error: uploadErrorText(result.error) });
      if (result.import.status === 'PENDING')
        return setStage({ kind: 'waiting', view: result.import });
      setStage({ kind: 'finished', view: result.import });
      if (result.import.imported > 0) onImported();
    } catch {
      setStage({ kind: 'choose', error: guests.errors.unavailable });
    }
  };

  if (stage.kind === 'finished') {
    return (
      <div className="flex flex-col gap-5">
        <ImportResult eventId={eventId} view={stage.view} />
        <button
          type="button"
          onClick={() => {
            setFile(null);
            setStage({ kind: 'choose' });
          }}
          className={buttonClasses('secondary', 'md', 'self-start')}
        >
          {t.another}
        </button>
      </div>
    );
  }

  const busy = stage.kind === 'uploading' || stage.kind === 'waiting';
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm text-stone-700">{t.intro}</p>
      <p className="text-sm text-stone-600">{t.excel}</p>
      <a
        href="/painel/modelo-convidados.csv"
        download
        className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}
      >
        <IconDownload size={16} stroke={1.75} aria-hidden="true" />
        {t.template}
      </a>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-file`} className="text-sm font-medium text-stone-800">
          {t.file}
        </label>
        <p id={`${id}-hint`} className="text-xs text-stone-600">
          {fillTemplate(t.fileHint, { max: String(IMPORT_LIMITS.maxRows) })}
        </p>
        <input
          id={`${id}-file`}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          aria-describedby={`${id}-hint`}
          aria-invalid={stage.kind === 'choose' && stage.error ? true : undefined}
          disabled={busy}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setStage({ kind: 'choose' });
          }}
          className={cn(
            inputClasses,
            'file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-800',
          )}
        />
      </div>
      {stage.kind === 'choose' && stage.error ? (
        <p role="alert" className="text-sm text-red-700">
          {stage.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!file || busy} className={buttonClasses('primary')}>
          {t.submit}
        </button>
        {busy ? (
          <p role="status" className="flex items-center gap-2 text-sm text-stone-600">
            <IconLoader2 size={18} stroke={1.75} className="animate-spin" aria-hidden="true" />
            {stage.kind === 'uploading' ? t.uploading : t.processing}
          </p>
        ) : null}
      </div>
    </form>
  );
}
