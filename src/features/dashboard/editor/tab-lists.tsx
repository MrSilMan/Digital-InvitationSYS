'use client';

import { IconPlus, IconRestore } from '@tabler/icons-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { buttonClasses } from '@/components/dashboard/styles';
import { editor } from '@/i18n/pt-AO';
import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';
import { fillTemplate } from '@/lib/template';
import { EDITOR_LIMITS, type EventEditorValues } from '@/lib/validation/event-editor';

import { IconPicker, ListItemControls, TextField, useFieldError } from './fields';

type RuleIcon = EventEditorValues['rules'][number]['icon'];

function LimitNote({ max }: { max: number }) {
  return (
    <p className="font-sans text-sm text-stone-500">
      {fillTemplate(editor.list.limit, { max: String(max) })}
    </p>
  );
}

export function TimelineTab() {
  const t = editor.timeline;
  const { control } = useFormContext<EventEditorValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'timeline' });
  const listError = useFieldError('timeline');

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-sm text-stone-600">{t.hint}</p>
      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const label = fillTemplate(t.item, { n: String(index + 1) });
          return (
            <li
              key={field.id}
              aria-label={label}
              className="grid items-end gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[auto_1fr_8rem_auto]"
            >
              <IconPicker name={`timeline.${index}.icon`} label={t.icon} />
              <TextField
                name={`timeline.${index}.label`}
                label={t.label}
                maxLength={EDITOR_LIMITS.timelineLabel}
              />
              <TextField name={`timeline.${index}.time`} label={t.time} type="time" />
              <ListItemControls
                index={index}
                count={fields.length}
                label={label}
                onMove={move}
                onRemove={() => remove(index)}
              />
            </li>
          );
        })}
      </ol>
      {listError ? <p className="font-sans text-sm text-red-700">{listError}</p> : null}
      {fields.length < EDITOR_LIMITS.timeline ? (
        <button
          type="button"
          onClick={() => append({ label: '', time: '', icon: 'heart' })}
          className={buttonClasses('secondary', 'md', 'self-start')}
        >
          <IconPlus size={18} stroke={1.75} aria-hidden="true" />
          {t.add}
        </button>
      ) : (
        <LimitNote max={EDITOR_LIMITS.timeline} />
      )}
    </div>
  );
}

export function RulesTab() {
  const t = editor.rules;
  const { control } = useFormContext<EventEditorValues>();
  const { fields, append, remove, move, replace } = useFieldArray({ control, name: 'rules' });
  const listError = useFieldError('rules');

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-sm text-stone-600">{t.hint}</p>
      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const label = fillTemplate(t.rule, { n: String(index + 1) });
          return (
            <li
              key={field.id}
              aria-label={label}
              className="grid items-end gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[auto_1fr_auto]"
            >
              <IconPicker name={`rules.${index}.icon`} label={editor.timeline.icon} />
              <TextField
                name={`rules.${index}.text`}
                label={t.text}
                maxLength={EDITOR_LIMITS.rule}
              />
              <ListItemControls
                index={index}
                count={fields.length}
                label={label}
                onMove={move}
                onRemove={() => remove(index)}
              />
            </li>
          );
        })}
      </ol>
      {listError ? <p className="font-sans text-sm text-red-700">{listError}</p> : null}
      <div className="flex flex-wrap gap-3">
        {fields.length < EDITOR_LIMITS.rules ? (
          <button
            type="button"
            onClick={() => append({ text: '', icon: 'heart' })}
            className={buttonClasses('secondary')}
          >
            <IconPlus size={18} stroke={1.75} aria-hidden="true" />
            {t.add}
          </button>
        ) : (
          <LimitNote max={EDITOR_LIMITS.rules} />
        )}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t.resetConfirm)) {
              replace(
                DEFAULT_GUEST_RULES.map((rule) => ({
                  text: rule.text,
                  icon: rule.icon as RuleIcon,
                })),
              );
            }
          }}
          className={buttonClasses('ghost')}
        >
          <IconRestore size={18} stroke={1.75} aria-hidden="true" />
          {t.reset}
        </button>
      </div>
    </div>
  );
}
