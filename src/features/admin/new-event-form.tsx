'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCircleCheck,
  IconCircleCheckFilled,
  IconLayoutDashboard,
  IconPlus,
  IconSettings,
  IconUserPlus,
  IconUserSearch,
} from '@tabler/icons-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
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

/** A card or radio card that shows it is chosen, and the keyboard focus of the radio inside. */
const CHOICE_CARD =
  'flex cursor-pointer rounded-xl border border-stone-300 bg-white transition-colors hover:border-stone-400 has-checked:border-stone-900 has-checked:ring-1 has-checked:ring-stone-900 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-stone-900 has-disabled:cursor-not-allowed has-disabled:bg-stone-50 has-disabled:text-stone-600';

/**
 * A field of a two-column grid that lines up with its neighbour: from `sm` it spans the grid's
 * four rows (label, hint, control, error) as a subgrid. Both fields need a hint.
 */
const ALIGNED_FIELD = 'sm:row-span-4 sm:grid sm:grid-rows-subgrid';

/** One numbered part of the form: a card with a legend and a line of help. */
function Step({
  number,
  legend,
  intro,
  children,
}: {
  number: number;
  legend: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn(cardClasses, 'min-w-0')}>
      <legend className="float-left flex w-full items-start gap-3 border-b border-stone-200 px-5 py-4">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-night text-xs font-semibold text-gold"
        >
          {number}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-stone-900">{legend}</span>
          <span className="text-sm font-normal text-stone-600">{intro}</span>
        </span>
      </legend>
      <div className="clear-both flex flex-col gap-5 p-5">{children}</div>
    </fieldset>
  );
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
        className={cn(cardClasses, 'flex flex-col items-start gap-5 p-6 sm:p-8')}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <IconCircleCheck size={26} stroke={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="evento-criado" className="text-xl font-semibold">
            {t.created.title}
          </h2>
          <p role="status" className="text-stone-700">
            {fillTemplate(t.created.text, { couple: created.couple })}
          </p>
        </div>
        {created.credentials ? (
          <TemporaryPassword credentials={created.credentials} loginUrl={loginUrl} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/eventos/${created.eventId}`} className={buttonClasses('primary')}>
            <IconSettings size={18} stroke={1.75} aria-hidden="true" />
            {t.created.manage}
          </Link>
          <Link
            href={`/painel/eventos/${created.eventId}/editar`}
            className={buttonClasses('secondary')}
          >
            <IconLayoutDashboard size={18} stroke={1.75} aria-hidden="true" />
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
            <IconPlus size={18} stroke={1.75} aria-hidden="true" />
            {t.created.another}
          </button>
        </div>
      </section>
    );
  }

  const example = `${appUrl.replace(/\/$/, '')}/c/${slug || 'braulio-e-nanda'}/…`;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Step number={1} legend={t.owner.legend} intro={t.owner.intro}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={cn(CHOICE_CARD, 'items-center gap-3 px-4 py-3.5 text-sm font-medium')}>
            <input
              type="radio"
              value="existing"
              disabled={owners.length === 0}
              {...register('owner.kind')}
              className="size-4 accent-stone-900"
            />
            <IconUserSearch size={20} stroke={1.75} aria-hidden="true" />
            {t.owner.existing}
          </label>
          <label className={cn(CHOICE_CARD, 'items-center gap-3 px-4 py-3.5 text-sm font-medium')}>
            <input
              type="radio"
              value="new"
              {...register('owner.kind')}
              className="size-4 accent-stone-900"
            />
            <IconUserPlus size={20} stroke={1.75} aria-hidden="true" />
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
          // Side by side, the two fields share the rows of label, hint, input and error
          // (subgrid): the inputs line up however long each hint is.
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-y-1.5">
            <Field
              id="novo-evento-conta-nome"
              label={admin.newAccount.name}
              hint={admin.newAccount.nameHint}
              error={ownerErrors?.name?.message}
              className={ALIGNED_FIELD}
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
              className={ALIGNED_FIELD}
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
      </Step>

      <Step number={2} legend={t.couple} intro={t.coupleIntro}>
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
      </Step>

      <Step number={3} legend={t.invitation} intro={t.invitationIntro}>
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

        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 font-sans text-sm font-medium text-stone-800">{t.theme}</legend>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(THEMES).map(([id, theme]) => (
              <label key={id} className={cn(CHOICE_CARD, 'group flex-col overflow-hidden')}>
                <input type="radio" value={id} {...register('themeId')} className="sr-only" />
                {/* The theme's paper and colours; its fonts are not loaded here. */}
                <span
                  aria-hidden="true"
                  className="relative flex h-20 items-end justify-between border-b border-stone-200 p-3"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <span
                    className="font-serif text-3xl leading-none italic"
                    style={{ color: theme.colors.script }}
                  >
                    Aa
                  </span>
                  <span className="flex gap-1">
                    {[theme.colors.accent, theme.colors.script, theme.colors.ink].map((color) => (
                      <span
                        key={color}
                        className="size-3.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <IconCircleCheckFilled
                    size={22}
                    className="absolute top-2 right-2 hidden text-stone-900 group-has-checked:block"
                  />
                </span>
                <span className="px-3 py-2.5 text-sm font-medium text-stone-900">{theme.name}</span>
              </label>
            ))}
          </div>
          {errors.themeId?.message ? (
            <p className="font-sans text-sm text-red-700">{errors.themeId.message}</p>
          ) : null}
        </fieldset>

        <Field
          id="novo-evento-limite"
          label={t.guestLimit}
          hint={t.guestLimitHint}
          error={errors.guestLimit?.message}
          className="sm:max-w-xs"
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
      </Step>

      <div
        className={cn(
          cardClasses,
          'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <p className="text-sm text-stone-600">{editor.general.phase.SAVE_THE_DATEHint}</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonClasses('primary', 'md', 'shrink-0')}
        >
          {isSubmitting ? t.submitting : t.submit}
        </button>
      </div>
      <Notice notice={notice} />
    </form>
  );
}
