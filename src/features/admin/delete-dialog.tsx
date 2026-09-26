'use client';

import { IconTrash } from '@tabler/icons-react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';

import { Dialog } from '@/components/dashboard/dialog';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { admin } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';

import { Notice, type NoticeState } from './notice';

interface DeleteDialogProps {
  open: boolean;
  title: string;
  /** What goes, in words (and lists). */
  children: ReactNode;
  /** "Para confirmar, escreva…"; `expected` is shown after it. */
  label: string;
  /** What the admin types: the event's address, the account's e-mail. */
  expected: string;
  /** Whether the typed text confirms (the server checks it again). */
  confirms: (typed: string) => boolean;
  pending: boolean;
  notice: NoticeState | null;
  onConfirm: (typed: string) => void;
  onCancel: () => void;
}

/**
 * Asks before deleting something for good: the admin types what identifies it, and only then can
 * press the button. Focus starts in the text field; Esc or "Cancelar" closes it.
 */
export function DeleteDialog({ open, title, onCancel, ...body }: DeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} closeLabel={admin.common.close}>
      {/* Mounted while open only: the typed text starts empty every time. */}
      <DeleteDialogBody onCancel={onCancel} {...body} />
    </Dialog>
  );
}

function DeleteDialogBody({
  children,
  label,
  expected,
  confirms,
  pending,
  notice,
  onConfirm,
  onCancel,
}: Omit<DeleteDialogProps, 'open' | 'title'>) {
  const id = useId();
  const [typed, setTyped] = useState('');
  const confirmed = confirms(typed);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmed && !pending) onConfirm(typed);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 text-sm text-stone-700">{children}</div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-confirmar`} className="text-sm font-medium text-stone-800">
          {label}{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.8125rem] break-all text-stone-900">
            {expected}
          </code>
        </label>
        <input
          id={`${id}-confirmar`}
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={cn(inputClasses, 'font-mono')}
          data-autofocus
        />
      </div>
      <Notice notice={notice} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={buttonClasses('secondary')}>
          {admin.common.cancel}
        </button>
        <button
          type="submit"
          disabled={!confirmed || pending}
          className={buttonClasses('destructive')}
        >
          <IconTrash size={18} stroke={1.75} aria-hidden="true" />
          {pending ? admin.common.deleting : admin.common.deleteForGood}
        </button>
      </div>
    </form>
  );
}
