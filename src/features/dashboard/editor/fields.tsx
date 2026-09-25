'use client';

import { IconArrowDown, IconArrowUp, IconTrash } from '@tabler/icons-react';
import type { HTMLInputTypeAttribute, ReactNode } from 'react';
import { get, type Path, useFormContext, useWatch } from 'react-hook-form';

import { Icon } from '@/components/icons';
import { CONTENT_ICON_KEYS } from '@/components/icons/keys';
import { Field } from '@/components/dashboard/field';
import { buttonClasses, inputClasses } from '@/components/dashboard/styles';
import { editor } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import type { EventEditorValues } from '@/lib/validation/event-editor';
import type { SectionId } from '@/lib/validation/sections';

export type EditorPath = Path<EventEditorValues>;

export const fieldId = (name: string) => `campo-${name.replace(/\./g, '-')}`;

export function useFieldError(name: EditorPath): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<EventEditorValues>();
  const error: unknown = get(errors, name);
  return typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message ?? '') || undefined
    : undefined;
}

interface TextFieldProps {
  name: EditorPath;
  label: ReactNode;
  hint?: ReactNode;
  placeholder?: string;
  maxLength?: number;
  type?: HTMLInputTypeAttribute;
  inputMode?: 'text' | 'tel' | 'url' | 'numeric' | 'decimal' | 'email';
  autoComplete?: string;
  className?: string;
  onBlur?: () => void;
}

export function TextField({
  name,
  label,
  hint,
  placeholder,
  maxLength,
  type = 'text',
  inputMode,
  autoComplete = 'off',
  className,
  onBlur,
}: TextFieldProps) {
  const { register } = useFormContext<EventEditorValues>();
  const error = useFieldError(name);
  const registration = register(name);
  return (
    <Field id={fieldId(name)} label={label} hint={hint} error={error} className={className}>
      {(props) => (
        <input
          {...props}
          {...registration}
          onBlur={(event) => {
            void registration.onBlur(event);
            onBlur?.();
          }}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          className={inputClasses}
        />
      )}
    </Field>
  );
}

interface TextAreaFieldProps {
  name: EditorPath;
  label: ReactNode;
  hint?: ReactNode;
  maxLength: number;
  rows?: number;
  /** Shows "n de max caracteres" under the field. */
  counter?: boolean;
}

export function TextAreaField({
  name,
  label,
  hint,
  maxLength,
  rows = 4,
  counter,
}: TextAreaFieldProps) {
  const { register, control } = useFormContext<EventEditorValues>();
  const error = useFieldError(name);
  const value = useWatch({ control, name });
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <Field id={fieldId(name)} label={label} hint={hint} error={error}>
      {(props) => (
        <>
          <textarea
            {...props}
            {...register(name)}
            rows={rows}
            maxLength={maxLength}
            className={cn(inputClasses, 'resize-y')}
          />
          {counter ? (
            <p className="text-right font-sans text-xs text-stone-500" aria-live="polite">
              {editor.message.counter
                .replace('{count}', String(length))
                .replace('{max}', String(maxLength))}
            </p>
          ) : null}
        </>
      )}
    </Field>
  );
}

/** A titled group of fields (a fieldset with a visible legend). */
export function FieldGroup({
  legend,
  hint,
  children,
  className,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn('flex flex-col gap-4', className)}>
      <legend className="mb-1 font-sans text-base font-semibold text-stone-900">{legend}</legend>
      {/* A fieldset's legend is not a flex item: no gap to cancel above the hint. */}
      {hint ? <p className="font-sans text-sm text-stone-500">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

/** Move up / move down / remove buttons of a list item. */
export function ListItemControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  /** What the item is called ("Local 2"), for the buttons' accessible names. */
  label: string;
  onMove: (from: number, to: number) => void;
  /** Without it, the item cannot be removed (e.g. invitation sections, only hidden). */
  onRemove?: () => void;
}) {
  const t = editor.list;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        aria-label={`${t.moveUp}: ${label}`}
        className={buttonClasses('ghost', 'icon')}
      >
        <IconArrowUp size={18} stroke={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={index === count - 1}
        aria-label={`${t.moveDown}: ${label}`}
        className={buttonClasses('ghost', 'icon')}
      >
        <IconArrowDown size={18} stroke={1.75} aria-hidden="true" />
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${t.remove}: ${label}`}
          className={buttonClasses('ghost', 'icon', 'text-red-700 hover:bg-red-50')}
        >
          <IconTrash size={18} stroke={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/** Icon choice as a radio group of icon tiles, folded away under the current icon. */
export function IconPicker({ name, label }: { name: EditorPath; label: string }) {
  const { register, control } = useFormContext<EventEditorValues>();
  const current = useWatch({ control, name });
  const currentKey = typeof current === 'string' ? current : 'heart';
  const labels: Record<string, string> = editor.icons;
  return (
    <details className="group relative">
      <summary
        className={cn(
          buttonClasses('secondary', 'sm'),
          'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
        )}
      >
        <Icon name={currentKey} size={20} stroke={1.5} />
        <span className="sr-only">
          {label}: {labels[currentKey] ?? currentKey}. {editor.timeline.chooseIcon}
        </span>
      </summary>
      <fieldset className="absolute z-20 mt-2 grid w-72 grid-cols-5 gap-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
        <legend className="sr-only">{label}</legend>
        {CONTENT_ICON_KEYS.map((key) => (
          <label
            key={key}
            title={labels[key]}
            className="flex size-12 cursor-pointer items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100 has-checked:bg-stone-900 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-stone-900"
          >
            <input type="radio" value={key} className="sr-only" {...register(name)} />
            <Icon name={key} size={24} stroke={1.5} />
            <span className="sr-only">{labels[key]}</span>
          </label>
        ))}
      </fieldset>
    </details>
  );
}

/** "This section is shown / hidden" with a button, for tabs whose section is optional. */
export function SectionVisibility({ id }: { id: SectionId }) {
  const { control, setValue } = useFormContext<EventEditorValues>();
  const sections = useWatch({ control, name: 'sections' });
  const index = sections.findIndex((section) => section.id === id);
  if (index < 0) return null;
  const visible = sections[index]?.visible ?? false;
  const t = editor.sectionToggle;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 font-sans text-sm',
        visible ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900',
      )}
    >
      <span>{visible ? t.visible : t.hidden}</span>
      <button
        type="button"
        onClick={() =>
          setValue(`sections.${index}.visible`, !visible, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        className={buttonClasses('secondary', 'sm')}
      >
        {visible ? t.hide : t.show}
      </button>
    </div>
  );
}
