'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { type Path, useForm, useWatch } from 'react-hook-form';

import { Field } from '@/components/dashboard/field';
import { buttonClasses, cardClasses, inputClasses } from '@/components/dashboard/styles';
import { admin, editor } from '@/i18n/pt-AO';
import { cn } from '@/lib/cn';
import { EVENT_SLUG_MAX_LENGTH, suggestEventSlug } from '@/lib/events/slug';
import { fillTemplate } from '@/lib/template';
import {
  ADMIN_LIMITS,
  type NewEventData,
  type NewEventFormValues,
  newEventSchema,
} from '@/lib/validation/admin';
import { EDITOR_LIMITS } from '@/lib/validation/event-editor';
import { DEFAULT_THEME_ID, THEMES } from '@/themes';

import { addEvent } from './actions';
import { adminErrorText } from './errors';
import { Notice, type NoticeState } from './notice';
import { TemporaryPassword } from './temporary-password';
import type { TemporaryCredentials } from './types';

const t = admin.newEvent;

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

interface NewEventFormProps {
  owners: OwnerOption[];
  /** `?conta=<id>`: the account to create the event for. */
  preselectedOwnerId: string | null;
  /** The public address, for the example link ("https://…/c/<slug>/…"). */
  appUrl: string;
  loginUrl: string;
}

interface Created {
  eventId: string;
  couple: string;
  credentials: TemporaryCredentials | null;
}

function initialValues(owners: OwnerOption[], preselected: string | null): NewEventFormValues {
  const owner = owners.find((option) => option.id === preselected);
  return {
    // Every owner field starts empty, whichever kind is chosen first (the schema keeps only the
    // chosen kind's fields).
    owner: {
      kind: owners.length > 0 ? 'existing' : 'new',
      userId: owner?.id ?? '',
      name: '',
      email: '',
    } as NewEventFormValues['owner'],
    groomName: '',
    brideName: '',
    date: '',
    time: '16:00',
    slug: '',
    themeId: DEFAULT_THEME_ID,
    guestLimit: '150',
  };
}

/**
 * A new event: the couple's account (existing or new), their names, the date, the address of the
 * guest links (suggested from the names), the theme and the plan.
 */
export function NewEventForm({ owners, preselectedOwnerId, appUrl, loginUrl }: NewEventFormProps) {
  const [created, setCreated] = useState<Created | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const form = useForm<NewEventFormValues, unknown, NewEventData>({
    resolver: zodResolver(newEventSchema),
    defaultValues: initialValues(owners, preselectedOwnerId),
    mode: 'onTouched',
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const ownerKind = useWatch({ control, name: 'owner.kind' });
  const slug = useWatch({ control, name: 'slug' });
  const ownerErrors = errors.owner as
    | { userId?: { message?: string }; name?: { message?: string }; email?: { message?: string } }
    | undefined;

  const suggestSlug = () => {
    if (slugEdited) return;
    const { groomName, brideName } = getValues();
    setValue('slug', suggestEventSlug(groomName, brideName));
  };

  const submit = handleSubmit(async () => {
    setNotice(null);
    const values = getValues();
    try {
      const result = await addEvent(values);
      if (result.ok) {
        setCreated({
          eventId: result.eventId,
          couple: `${values.groomName.trim()} & ${values.brideName.trim()}`,
          credentials: result.credentials,
        });
        return;
      }
      for (const issue of result.issues ?? []) {
        setError(issue.path as Path<NewEventFormValues>, { message: issue.message });
      }
      const text = adminErrorText(result);
      if (result.error === 'slug-taken') setError('slug', { message: text });
      else if (result.error === 'email-taken') setError('owner.email', { message: text });
      else if (result.error === 'owner-invalid') setError('owner.userId', { message: text });
      setNotice({ tone: 'error', text: result.error === 'invalid' ? admin.errors.invalid : text });
    } catch {
      setNotice({ tone: 'error', text: admin.errors.unavailable });
    }
  });

  if (created) {
    return (
      <section
        aria-labelledby="evento-criado"
        className={cn(cardClasses, 'flex flex-col items-start gap-4 p-6')}
      >
        <h2 id="evento-criado" className="text-xl font-semibold">
          {t.created.title}
        </h2>
        <p role="status" className="text-stone-700">
          {fillTemplate(t.created.text, { couple: created.couple })}
        </p>
        {created.credentials ? (
          <TemporaryPassword credentials={created.credentials} loginUrl={loginUrl} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/eventos/${created.eventId}`} className={buttonClasses('primary')}>
            {t.created.manage}
          </Link>
          <Link
            href={`/painel/eventos/${created.eventId}/editar`}
            className={buttonClasses('secondary')}
          >
            {t.created.open}
          </Link>
          <button
            type="button"
            onClick={() => {
              reset(initialValues(owners, null));
              setSlugEdited(false);
              setCreated(null);
            }}
            className={buttonClasses('ghost')}
          >
            {t.created.another}
          </button>
        </div>
      </section>
    );
  }

  const example = `${appUrl.replace(/\/$/, '')}/c/${slug || 'braulio-e-nanda'}/…`;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <fieldset className={cn(cardClasses, 'flex flex-col gap-4 p-5')}>
        <legend className="float-left mb-1 w-full text-lg font-semibold">{t.owner.legend}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              value="existing"
              disabled={owners.length === 0}
              {...register('owner.kind')}
              className="size-4 accent-stone-900"
            />
            {t.owner.existing}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              value="new"
              {...register('owner.kind')}
              className="size-4 accent-stone-900"
            />
            {t.owner.new}
          </label>
        </div>
        {owners.length === 0 ? <p className="text-sm text-stone-600">{t.owner.none}</p> : null}
        {ownerKind === 'existing' ? (
          <Field id="novo-evento-conta" label={t.owner.choose} error={ownerErrors?.userId?.message}>
            {(props) => (
              <select {...props} {...register('owner.userId')} className={inputClasses}>
                <option value="">{t.owner.placeholder}</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} · {owner.email}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="novo-evento-conta-nome"
              label={admin.newAccount.name}
              hint={admin.newAccount.nameHint}
              error={ownerErrors?.name?.message}
            >
              {(props) => (
                <input
                  {...props}
                  {...register('owner.name')}
                  type="text"
                  autoComplete="off"
                  maxLength={ADMIN_LIMITS.accountName}
                  className={inputClasses}
                />
              )}
            </Field>
            <Field
              id="novo-evento-conta-email"
              label={admin.newAccount.email}
              hint={t.owner.newHint}
              error={ownerErrors?.email?.message}
            >
              {(props) => (
                <input
                  {...props}
                  {...register('owner.email')}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  className={inputClasses}
                />
              )}
            </Field>
          </div>
        )}
      </fieldset>

      <fieldset className={cn(cardClasses, 'flex flex-col gap-4 p-5')}>
        <legend className="float-left mb-1 w-full text-lg font-semibold">{t.couple}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="novo-evento-noivo" label={t.groomName} error={errors.groomName?.message}>
            {(props) => (
              <input
                {...props}
                {...register('groomName', { onChange: suggestSlug })}
                type="text"
                autoComplete="off"
                maxLength={EDITOR_LIMITS.name}
                className={inputClasses}
              />
            )}
          </Field>
          <Field id="novo-evento-noiva" label={t.brideName} error={errors.brideName?.message}>
            {(props) => (
              <input
                {...props}
                {...register('brideName', { onChange: suggestSlug })}
                type="text"
                autoComplete="off"
                maxLength={EDITOR_LIMITS.name}
                className={inputClasses}
              />
            )}
          </Field>
          <Field id="novo-evento-data" label={t.date} error={errors.date?.message}>
            {(props) => (
              <input {...props} {...register('date')} type="date" className={inputClasses} />
            )}
          </Field>
          <Field id="novo-evento-hora" label={t.time} error={errors.time?.message}>
            {(props) => (
              <input {...props} {...register('time')} type="time" className={inputClasses} />
            )}
          </Field>
        </div>
        <Field
          id="novo-evento-endereco"
          label={t.slug}
          hint={fillTemplate(t.slugHint, { example })}
          error={errors.slug?.message}
        >
          {(props) => (
            <input
              {...props}
              {...register('slug', {
                onChange: (event: { target: { value: string } }) =>
                  setSlugEdited(event.target.value.trim() !== ''),
              })}
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={EVENT_SLUG_MAX_LENGTH}
              className={cn(inputClasses, 'font-mono')}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="novo-evento-tema" label={t.theme} error={errors.themeId?.message}>
            {(props) => (
              <select {...props} {...register('themeId')} className={inputClasses}>
                {Object.entries(THEMES).map(([id, theme]) => (
                  <option key={id} value={id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="novo-evento-limite"
            label={t.guestLimit}
            hint={t.guestLimitHint}
            error={errors.guestLimit?.message}
          >
            {(props) => (
              <input
                {...props}
                {...register('guestLimit')}
                type="number"
                inputMode="numeric"
                min={1}
                max={ADMIN_LIMITS.guestLimit}
                className={inputClasses}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-col items-start gap-3">
        <button type="submit" disabled={isSubmitting} className={buttonClasses('primary')}>
          {isSubmitting ? t.submitting : t.submit}
        </button>
        <Notice notice={notice} />
        <p className="text-xs text-stone-500">{editor.general.phase.SAVE_THE_DATEHint}</p>
      </div>
    </form>
  );
}
