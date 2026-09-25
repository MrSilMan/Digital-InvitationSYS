'use client';

import { IconX } from '@tabler/icons-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { buttonClasses } from './styles';

interface DialogProps {
  open: boolean;
  /** Called on Esc, the close button, or when the dialog closes itself. */
  onClose: () => void;
  title: ReactNode;
  closeLabel: string;
  children: ReactNode;
}

/**
 * A modal dialog on the native <dialog> element: the browser traps focus, closes it on Esc and
 * returns focus to where it was. The content mounts only while open, so forms start fresh.
 */
export function Dialog({ open, onClose, title, closeLabel, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 font-sans text-stone-900 shadow-xl backdrop:bg-stone-900/40"
    >
      {open ? (
        <div className="flex max-h-[calc(100svh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4">
            <h2 id={titleId} className="min-w-0 font-serif text-xl wrap-break-word text-stone-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={buttonClasses('ghost', 'icon', '-mr-2')}
              aria-label={closeLabel}
            >
              <IconX size={20} stroke={1.75} aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
