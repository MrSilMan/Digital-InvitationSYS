'use client';

import { IconPlus, IconX } from '@tabler/icons-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { buttonClasses } from '@/components/dashboard/styles';
import { editor } from '@/i18n/pt-AO';
import { compactIban, formatIban, isValidIban } from '@/lib/iban';
import { fillTemplate } from '@/lib/template';
import { EDITOR_LIMITS, type EventEditorValues } from '@/lib/validation/event-editor';

import { FieldGroup, SectionVisibility, TextAreaField, TextField } from './fields';

export function MessageTab() {
  const t = editor.message;
  return (
    <div className="flex flex-col gap-6">
      <SectionVisibility id="message" />
      <TextAreaField
        name="coupleMessage"
        label={t.label}
        hint={t.hint}
        maxLength={EDITOR_LIMITS.message}
        rows={8}
        counter
      />
    </div>
  );
}

export function DressCodeTab() {
  const t = editor.dressCode;
  const { control, setValue } = useFormContext<EventEditorValues>();
  const colors = useWatch({ control, name: 'dressCodeColors' });
  const update = (next: string[]) =>
    setValue('dressCodeColors', next, { shouldDirty: true, shouldValidate: true });

  return (
    <div className="flex flex-col gap-8">
      <SectionVisibility id="dressCode" />
      <TextAreaField
        name="dressCodeText"
        label={t.text}
        maxLength={EDITOR_LIMITS.dressCodeText}
        rows={3}
      />
      <FieldGroup legend={t.colors} hint={t.colorsHint}>
        <ul className="flex flex-wrap gap-3">
          {colors.map((color, index) => {
            const label = fillTemplate(t.color, { n: String(index + 1) });
            return (
              <li
                key={index}
                className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1.5"
              >
                <input
                  type="color"
                  aria-label={label}
                  value={color}
                  onChange={(event) =>
                    update(colors.map((item, i) => (i === index ? event.target.value : item)))
                  }
                  className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => update(colors.filter((_, i) => i !== index))}
                  aria-label={`${editor.list.remove}: ${label}`}
                  className={buttonClasses('ghost', 'icon')}
                >
                  <IconX size={16} stroke={1.75} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        {colors.length < EDITOR_LIMITS.dressCodeColors ? (
          <button
            type="button"
            onClick={() => update([...colors, '#d8c3a5'])}
            className={buttonClasses('secondary', 'md', 'self-start')}
          >
            <IconPlus size={18} stroke={1.75} aria-hidden="true" />
            {t.addColor}
          </button>
        ) : null}
      </FieldGroup>
    </div>
  );
}

export function GiftsTab() {
  const t = editor.gifts;
  const { getValues, setValue } = useFormContext<EventEditorValues>();
  return (
    <div className="flex flex-col gap-6">
      <SectionVisibility id="gifts" />
      <TextAreaField name="giftText" label={t.text} maxLength={EDITOR_LIMITS.giftText} rows={4} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="giftIban"
          label={t.iban}
          hint={t.ibanHint}
          autoComplete="off"
          onBlur={() => {
            const iban = getValues('giftIban');
            if (isValidIban(iban)) {
              setValue('giftIban', formatIban(compactIban(iban)), { shouldValidate: true });
            }
          }}
        />
        <TextField
          name="giftAccountHolder"
          label={t.accountHolder}
          maxLength={EDITOR_LIMITS.accountHolder}
        />
      </div>
    </div>
  );
}
