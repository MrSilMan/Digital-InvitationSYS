'use client';

import { IconSquareCheckFilled } from '@tabler/icons-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { buttonClasses } from '@/components/dashboard/styles';
import { editor } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import type { EventEditorValues } from '@/lib/validation/event-editor';
import { DEFAULT_THEME_ID, getTheme, THEMES } from '@/themes';
import { contrastRatio } from '@/themes/contrast';

import { FieldGroup, ListItemControls } from './fields';

const t = editor.general;
const COLOR_ROLES = ['background', 'ink', 'script', 'accent'] as const;
type ColorRole = (typeof COLOR_ROLES)[number];

const radioCard =
  'flex cursor-pointer flex-col gap-1 rounded-xl border border-stone-300 bg-white p-4 font-sans has-checked:border-stone-900 has-checked:ring-2 has-checked:ring-stone-900/15 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-stone-900';

/** WCAG checks of the couple's colours (the same minimums as the theme tests). */
function contrastWarnings(colors: Record<ColorRole, string>, accentContrast: string): string[] {
  const warn = (template: string, ratio: number, min: number) =>
    fillTemplate(template, {
      ratio: ratio.toFixed(1).replace('.', ','),
      min: String(min).replace('.', ','),
    });
  const warnings: string[] = [];
  const ink = contrastRatio(colors.ink, colors.background);
  if (ink < 4.5) warnings.push(warn(t.colors.lowContrast.ink, ink, 4.5));
  const script = contrastRatio(colors.script, colors.background);
  if (script < 3) warnings.push(warn(t.colors.lowContrast.script, script, 3));
  const accent = contrastRatio(colors.accent, colors.background);
  if (accent < 3) warnings.push(warn(t.colors.lowContrast.accent, accent, 3));
  const accentText = contrastRatio(accentContrast, colors.accent);
  if (accentText < 4.5) warnings.push(warn(t.colors.lowContrast.accentText, accentText, 4.5));
  return warnings;
}

export function GeneralTab() {
  const { register, control, setValue } = useFormContext<EventEditorValues>();
  const themeId = useWatch({ control, name: 'themeId' });
  const overrides = useWatch({ control, name: 'colors' });
  const sections = useWatch({ control, name: 'sections' });
  const { fields, move } = useFieldArray({ control, name: 'sections', keyName: 'fieldKey' });

  const theme = getTheme(themeId ?? DEFAULT_THEME_ID);
  const effective = Object.fromEntries(
    COLOR_ROLES.map((role) => [role, overrides[role] || theme.colors[role]]),
  ) as Record<ColorRole, string>;
  const warnings = contrastWarnings(effective, theme.colors.accentContrast);

  return (
    <div className="flex flex-col gap-10">
      <FieldGroup legend={t.phase.legend}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['SAVE_THE_DATE', 'INVITATION'] as const).map((phase) => (
            <label key={phase} className={radioCard}>
              <span className="flex items-center gap-2 font-medium text-stone-900">
                <input
                  type="radio"
                  value={phase}
                  {...register('phase')}
                  className="accent-stone-900"
                />
                {t.phase[phase]}
              </span>
              <span className="text-sm text-stone-600">{t.phase[`${phase}Hint`]}</span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup legend={t.theme.legend}>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(THEMES).map((option) => (
            <label key={option.id} className={radioCard}>
              <span className="flex items-center gap-2 font-medium text-stone-900">
                <input
                  type="radio"
                  value={option.id}
                  {...register('themeId')}
                  className="accent-stone-900"
                />
                {option.name}
              </span>
              <span className="mt-1 flex gap-1.5" aria-hidden="true">
                {[
                  option.colors.background,
                  option.colors.script,
                  option.colors.accent,
                  option.colors.ink,
                ].map((color) => (
                  <span
                    key={color}
                    className="size-6 rounded-full border border-stone-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup legend={t.colors.legend} hint={t.colors.hint}>
        <div className="grid gap-3 sm:grid-cols-2">
          {COLOR_ROLES.map((role) => {
            const id = `cor-${role}`;
            const override = overrides[role];
            return (
              <div key={role} className="flex items-center gap-3 font-sans">
                <input
                  id={id}
                  type="color"
                  value={effective[role]}
                  onChange={(event) =>
                    setValue(`colors.${role}`, event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
                />
                <div className="flex min-w-0 flex-col">
                  <label htmlFor={id} className="text-sm font-medium text-stone-800">
                    {t.colors[role]}
                  </label>
                  <span className="font-mono text-xs text-stone-500">
                    {override || `${t.colors.themeColor} (${theme.colors[role]})`}
                  </span>
                </div>
                {override ? (
                  <button
                    type="button"
                    onClick={() =>
                      setValue(`colors.${role}`, '', { shouldDirty: true, shouldValidate: true })
                    }
                    className={buttonClasses('ghost', 'sm', 'ml-auto')}
                  >
                    {t.colors.reset}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        {warnings.length > 0 ? (
          <ul className="flex flex-col gap-1 rounded-xl bg-amber-50 px-4 py-3 font-sans text-sm text-amber-900">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </FieldGroup>

      <FieldGroup legend={t.sections.legend} hint={t.sections.hint}>
        <ol className="flex flex-col divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {fields.map((field, index) => {
            const id = sections[index]?.id ?? field.id;
            const name = t.sections.names[id];
            const locked = id === 'invitation';
            return (
              <li key={field.fieldKey} className="flex items-center gap-3 px-3 py-2 font-sans">
                {locked ? (
                  // Not a disabled checkbox: React Hook Form drops disabled fields' values.
                  <div className="flex flex-1 flex-wrap items-center gap-x-3 text-sm">
                    <IconSquareCheckFilled
                      size={18}
                      aria-hidden="true"
                      className="text-stone-400"
                    />
                    <span className="text-stone-900">{name}</span>
                    <span className="text-xs text-stone-500">{t.sections.alwaysVisible}</span>
                  </div>
                ) : (
                  <label className="flex flex-1 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      {...register(`sections.${index}.visible`)}
                      className="size-4 accent-stone-900"
                    />
                    <span className="text-stone-900">{name}</span>
                  </label>
                )}
                <ListItemControls
                  index={index}
                  count={fields.length}
                  label={name}
                  onMove={(from, to) => move(from, to)}
                />
              </li>
            );
          })}
        </ol>
      </FieldGroup>
    </div>
  );
}
