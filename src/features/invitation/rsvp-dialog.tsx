'use client';

import { IconCircleCheckFilled, IconX } from '@tabler/icons-react';
import { useRef, type ReactNode } from 'react';

import { PILL_ICON_SIZE, pillButtonClasses } from '@/components/ui/pill-button-classes';

interface RsvpDialogProps {
  /** Button label, e.g. "Confirmar <strong>presença</strong>". */
  label: ReactNode;
  closeLabel: string;
  /** Id of the heading inside `children`. */
  labelledBy: string;
  /** The RSVP content, rendered on the server. */
  children: ReactNode;
}

/** "Confirmar presença" on the Save the Date page: opens the RSVP options in a native dialog. */
export function RsvpDialog({ label, closeLabel, labelledBy, children }: RsvpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        className={pillButtonClasses('pill')}
        onClick={() => dialogRef.current?.showModal()}
      >
        <IconCircleCheckFilled size={PILL_ICON_SIZE.pill} aria-hidden="true" />
        <span>{label}</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={labelledBy}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl theme-surface p-0 shadow-2xl backdrop:bg-black/45"
        onClick={(event) => {
          // A tap on the backdrop (outside the panel) closes the dialog.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="relative flex flex-col items-center gap-6 px-6 pt-12 pb-10 text-center">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={closeLabel}
            className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <IconX size={24} stroke={1.75} aria-hidden="true" />
          </button>
          {children}
        </div>
      </dialog>
    </>
  );
}
