'use client';

import { useFormContext } from 'react-hook-form';

import { editor } from '@/i18n/pt-AO';
import { formatAngolanPhone, normalizeAngolanPhone } from '@/lib/validation/phone';
import type { EventEditorValues } from '@/lib/validation/event-editor';

import { FieldGroup, SectionVisibility, TextField } from './fields';

const t = editor.rsvp;

export function RsvpTab() {
  const { register, getValues, setValue } = useFormContext<EventEditorValues>();

  /** "923456789" → "+244 923 456 789" once the number is complete. */
  const tidyPhone = (name: 'groomWhatsapp' | 'brideWhatsapp') => () => {
    const normalized = normalizeAngolanPhone(getValues(name));
    if (normalized) setValue(name, formatAngolanPhone(normalized), { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionVisibility id="rsvp" />
      <FieldGroup legend={t.mode.legend}>
        <div className="flex flex-col gap-2 font-sans text-sm">
          {(['WHATSAPP', 'FORM', 'BOTH'] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-3">
              <input
                type="radio"
                value={mode}
                {...register('rsvpMode')}
                className="accent-stone-900"
              />
              {t.mode[mode]}
            </label>
          ))}
        </div>
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="groomWhatsapp"
          label={t.groomWhatsapp}
          hint={t.whatsappHint}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          onBlur={tidyPhone('groomWhatsapp')}
        />
        <TextField
          name="brideWhatsapp"
          label={t.brideWhatsapp}
          hint={t.whatsappHint}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          onBlur={tidyPhone('brideWhatsapp')}
        />
      </div>
      <TextField
        name="rsvpDeadline"
        label={t.deadline}
        hint={t.deadlineHint}
        type="date"
        className="max-w-60"
      />
    </div>
  );
}
