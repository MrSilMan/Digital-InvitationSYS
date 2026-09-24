import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

interface FieldProps {
  id: string;
  label: ReactNode;
  /** Short help shown under the label. */
  hint?: ReactNode;
  error?: string;
  className?: string;
  /** Renders the control with the ids that tie it to its label, hint and error. */
  children: (props: FieldControlProps) => ReactNode;
}

/** A labelled form control with an optional hint and error message, wired for screen readers. */
export function Field({ id, label, hint, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="font-sans text-sm font-medium text-stone-800">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="font-sans text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={errorId} className="font-sans text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
