'use client';

import { editor, invitationDefaults } from '@/i18n/pt-AO';
import { EDITOR_LIMITS } from '@/lib/validation/event-editor';

import { FieldGroup, TextField } from './fields';

const t = editor.couple;

function Parents({ side }: { side: 'groomParents' | 'brideParents' }) {
  return (
    <FieldGroup
      legend={side === 'groomParents' ? t.groomParents : t.brideParents}
      hint={t.parentsHint}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <TextField
            key={index}
            name={`${side}.${index}`}
            label={t.parent.replace('{n}', String(index + 1))}
            maxLength={EDITOR_LIMITS.parent}
          />
        ))}
      </div>
    </FieldGroup>
  );
}

export function CoupleTab() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="groomName" label={t.groomName} maxLength={EDITOR_LIMITS.name} />
        <TextField name="brideName" label={t.brideName} maxLength={EDITOR_LIMITS.name} />
      </div>
      <Parents side="groomParents" />
      <Parents side="brideParents" />
      <TextField
        name="monogram"
        label={t.monogram}
        hint={t.monogramHint}
        maxLength={2}
        className="max-w-48"
      />
      <FieldGroup legend={t.cardTexts} hint={t.cardTextsHint}>
        <TextField
          name="introLine"
          label={t.introLine}
          placeholder={invitationDefaults.introLine}
          maxLength={EDITOR_LIMITS.line}
        />
        <TextField
          name="invitationLine"
          label={t.invitationLine}
          placeholder={invitationDefaults.invitationLine}
          maxLength={EDITOR_LIMITS.line}
        />
        <TextField
          name="celebrationLine"
          label={t.celebrationLine}
          placeholder={invitationDefaults.celebrationLine}
          maxLength={EDITOR_LIMITS.line}
        />
        <TextField
          name="infoBoxText"
          label={t.infoBoxText}
          hint={t.infoBoxHint}
          placeholder={invitationDefaults.infoBoxText.replace('{seats}', '{pessoas}')}
          maxLength={EDITOR_LIMITS.line}
        />
      </FieldGroup>
    </div>
  );
}
