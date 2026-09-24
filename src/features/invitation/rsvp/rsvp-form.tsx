'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconAlertCircle, IconCircleCheckFilled } from '@tabler/icons-react';
import { useMemo, useState, useSyncExternalStore, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { PILL_ICON_SIZE, pillButtonClasses } from '@/components/ui/pill-button-classes';
import { cn } from '@/lib/cn';
import { fillTemplate } from '@/lib/template';
import {
  MESSAGE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  rsvpAnswerSchema,
  type RsvpAnswer,
  type RsvpFormValues,
} from '@/lib/validation/rsvp';

import type { GuestRsvp } from '../types';

import { submitRsvp, type RsvpErrorCode } from './actions';

export interface RsvpFormLabels {
  question: string;
  yes: string;
  no: string;
  people: string;
  companions: string;
  companion: string;
  companionPlaceholder: string;
  message: string;
  submit: string;
  sending: string;
  confirmed: string;
  declined: string;
  change: string;
  errors: Record<RsvpErrorCode | 'network', string>;
  /** "1 pessoa" / "2 pessoas" */
  peopleForms: { one: string; other: string };
}

interface RsvpFormProps {
  eventSlug: string;
  guestToken: string;
  guestName: string;
  seatsAllowed: number;
  /** The saved answer, if the guest already answered with the form. */
  initial: GuestRsvp | null;
  /** Past the deadline: the answer is shown, not editable. */
  closed: boolean;
  labels: RsvpFormLabels;
  /** The dashboard's preview: the form is shown but cannot be sent, with this notice. */
  previewNotice?: string;
}

function toFormValues(rsvp: GuestRsvp | null, seats: number): RsvpFormValues {
  const attending = rsvp?.attending === true ? 'sim' : rsvp?.attending === false ? 'nao' : '';
  const people = rsvp?.attending ? (rsvp.peopleCount ?? seats) : seats;
  return {
    attending,
    peopleCount: String(Math.min(Math.max(people, 1), seats)),
    companionNames: Array.from(
      { length: seats - 1 },
      (_, index) => rsvp?.companionNames[index] ?? '',
    ),
    message: rsvp?.message ?? '',
  };
}

const fieldClass =
  'w-full rounded-xl border border-ink/30 bg-white/75 px-4 py-3 font-body text-[1.1rem] text-ink placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const labelClass = 'font-caps text-[clamp(1rem,4.6cqi,1.2rem)] tracking-wider text-ink';

const noSubscription = () => () => {};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="mt-1.5 flex items-center gap-1.5 font-body text-base font-medium text-ink"
    >
      <IconAlertCircle
        size={18}
        stroke={1.75}
        aria-hidden="true"
        className="shrink-0 text-accent"
      />
      {message}
    </p>
  );
}

/**
 * The RSVP form (React Hook Form + the shared Zod schema). Validates in the browser for quick
 * feedback; the Server Action validates again. Shows the saved answer when there is one, with
 * "Alterar a resposta" until the deadline.
 */
export function RsvpForm({
  eventSlug,
  guestToken,
  guestName,
  seatsAllowed,
  initial,
  closed,
  labels,
  previewNotice,
}: RsvpFormProps) {
  const seats = Math.max(1, seatsAllowed);
  const schema = useMemo(() => rsvpAnswerSchema(seats), [seats]);
  // A WhatsApp tap alone (attending null) is not an answer yet.
  const [saved, setSaved] = useState<GuestRsvp | null>(
    initial && initial.attending !== null ? initial : null,
  );
  const [editing, setEditing] = useState(saved === null);
  const [formError, setFormError] = useState<RsvpErrorCode | 'network' | null>(null);
  const [pending, startTransition] = useTransition();
  // After saving, the confirmation takes the focus (screen readers announce it).
  const [focusSummary, setFocusSummary] = useState(false);
  // Until React is ready the submit button stays disabled: a plain browser submission would put
  // the answers in the URL instead of calling the Server Action.
  const ready = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<RsvpFormValues, unknown, RsvpAnswer>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(saved, seats),
  });
  const attending = useWatch({ control, name: 'attending' });
  const peopleCount = Number(useWatch({ control, name: 'peopleCount' })) || 1;

  const countLabel = (count: number) =>
    `${count} ${count === 1 ? labels.peopleForms.one : labels.peopleForms.other}`;

  const onSubmit = handleSubmit(() => {
    if (previewNotice) return;
    setFormError(null);
    // The raw values: the server parses them again with the same schema.
    const answer = getValues();
    startTransition(async () => {
      try {
        const result = await submitRsvp({ eventSlug, guestToken, answer });
        if (result.ok) {
          setSaved(result.rsvp);
          setEditing(false);
          setFocusSummary(true);
        } else {
          setFormError(result.error);
        }
      } catch {
        setFormError('network');
      }
    });
  });

  if (saved && (!editing || closed)) {
    return (
      <div
        ref={(node) => {
          if (node && focusSummary) node.focus();
        }}
        tabIndex={-1}
        role="status"
        className="w-full max-w-88 rounded-2xl border border-accent/60 bg-white/40 px-5 py-5 text-center focus-visible:outline-2 focus-visible:outline-accent"
      >
        <IconCircleCheckFilled size={40} aria-hidden="true" className="mx-auto text-accent" />
        <p className="mt-2 font-body text-[clamp(1.2rem,5.6cqi,1.4rem)] leading-snug font-medium text-balance">
          {saved.attending
            ? fillTemplate(labels.confirmed, {
                guest: guestName,
                people: countLabel(saved.peopleCount ?? 1),
              })
            : fillTemplate(labels.declined, { guest: guestName })}
        </p>
        {saved.attending && saved.companionNames.length > 0 ? (
          <p className="mt-2 font-caps text-base tracking-wide text-muted">
            {saved.companionNames.join(' · ')}
          </p>
        ) : null}
        {closed ? null : (
          <button
            type="button"
            onClick={() => {
              setFocusSummary(false);
              setEditing(true);
            }}
            className="mt-4 font-caps text-lg tracking-wide text-accent underline underline-offset-4"
          >
            {labels.change}
          </button>
        )}
      </div>
    );
  }

  if (closed) return null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-88 flex-col gap-6 text-left">
      <fieldset aria-describedby={errors.attending ? 'rsvp-attending-error' : undefined}>
        <legend className={cn(labelClass, 'mb-3 w-full text-center')}>{labels.question}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['sim', 'nao'] as const).map((value) => (
            <label
              key={value}
              className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-accent px-3 py-3 text-center font-caps text-[clamp(0.95rem,4.4cqi,1.1rem)] leading-tight tracking-wide text-ink transition-colors has-checked:bg-accent has-checked:text-accent-contrast has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <input type="radio" value={value} className="sr-only" {...register('attending')} />
              {value === 'sim' ? labels.yes : labels.no}
            </label>
          ))}
        </div>
        <FieldError id="rsvp-attending-error" message={errors.attending?.message} />
      </fieldset>

      {attending === 'sim' && seats > 1 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rsvp-people" className={labelClass}>
            {labels.people}
          </label>
          <select
            id="rsvp-people"
            className={fieldClass}
            aria-invalid={errors.peopleCount ? true : undefined}
            aria-describedby={errors.peopleCount ? 'rsvp-people-error' : undefined}
            {...register('peopleCount')}
          >
            {Array.from({ length: seats }, (_, index) => index + 1).map((count) => (
              <option key={count} value={String(count)}>
                {countLabel(count)}
              </option>
            ))}
          </select>
          <FieldError id="rsvp-people-error" message={errors.peopleCount?.message} />
        </div>
      ) : null}

      {attending === 'sim' && peopleCount > 1 ? (
        <fieldset className="flex flex-col gap-2.5">
          <legend className={cn(labelClass, 'mb-1.5')}>{labels.companions}</legend>
          {Array.from({ length: peopleCount - 1 }, (_, index) => {
            const label = fillTemplate(labels.companion, { n: String(index + 1) });
            const error = errors.companionNames?.[index]?.message;
            return (
              <div key={index}>
                <input
                  type="text"
                  aria-label={label}
                  placeholder={`${label} · ${labels.companionPlaceholder}`}
                  maxLength={NAME_MAX_LENGTH}
                  autoComplete="off"
                  className={fieldClass}
                  aria-invalid={error ? true : undefined}
                  {...register(`companionNames.${index}`)}
                />
                <FieldError id={`rsvp-companion-${index}-error`} message={error} />
              </div>
            );
          })}
        </fieldset>
      ) : null}

      {attending ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rsvp-message" className={labelClass}>
            {labels.message}
          </label>
          <textarea
            id="rsvp-message"
            rows={3}
            maxLength={MESSAGE_MAX_LENGTH}
            className={cn(fieldClass, 'resize-y')}
            aria-invalid={errors.message ? true : undefined}
            {...register('message')}
          />
          <FieldError id="rsvp-message-error" message={errors.message?.message} />
        </div>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-accent/60 bg-white/60 px-4 py-3 font-body text-base font-medium text-ink"
        >
          <IconAlertCircle
            size={20}
            stroke={1.75}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-accent"
          />
          {labels.errors[formError]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!ready || pending || Boolean(previewNotice)}
        className={pillButtonClasses('pill', 'self-center')}
      >
        <IconCircleCheckFilled size={PILL_ICON_SIZE.pill} aria-hidden="true" />
        <span>{pending ? labels.sending : labels.submit}</span>
      </button>
      {previewNotice ? (
        <p className="text-center font-body text-base text-muted">{previewNotice}</p>
      ) : null}
    </form>
  );
}
