import { z } from 'zod';

import { admin, editor } from '@/i18n/pt-AO';
import { luandaDateTime } from '@/lib/luanda-time';
import { fillTemplate } from '@/lib/template';
import { emailSchema } from '@/lib/validation/auth';
import { editorFields } from '@/lib/validation/event-editor';
import { collapseSpaces } from '@/lib/validation/guest';
import { isEventSlug } from '@/lib/validation/invitation';

/**
 * The admin area's forms, validated the same way in the browser and in the Server Actions. Form
 * values are plain strings; the schemas return database-ready data.
 */

export const ADMIN_LIMITS = {
  accountName: 80,
  /** The largest plan a couple can have. */
  guestLimit: 2000,
} as const;
const L = ADMIN_LIMITS;

const tooLong = (max: number) => fillTemplate(editor.validation.tooLong, { max: String(max) });

const accountName = z
  .string()
  .transform(collapseSpaces)
  .pipe(z.string().min(1, editor.validation.required).max(L.accountName, tooLong(L.accountName)));

/** A couple's account: creating one, or changing its name and e-mail. */
export const accountSchema = z.object({ name: accountName, email: emailSchema });

export type AccountFormValues = z.input<typeof accountSchema>;
export type AccountData = z.output<typeof accountSchema>;

/** The event's plan: a whole number of guests, typed as text. */
export const guestLimitSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^\d{1,4}$/.test(value) && Number(value) >= 1 && Number(value) <= L.guestLimit,
    { message: fillTemplate(admin.validation.guestLimit, { max: String(L.guestLimit) }) },
  )
  .transform(Number);

const ownerSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('existing'),
    userId: z.string().trim().min(1, admin.validation.chooseAccount).max(64),
  }),
  z.object({ kind: z.literal('new'), name: accountName, email: emailSchema }),
]);

/** A new event, for an existing couple account or a new one created with it. */
export const newEventSchema = z
  .object({
    owner: ownerSchema,
    groomName: editorFields.groomName,
    brideName: editorFields.brideName,
    date: editorFields.date,
    time: editorFields.startTime,
    slug: z.string().trim().toLowerCase().refine(isEventSlug, admin.validation.slug),
    themeId: editorFields.themeId,
    guestLimit: guestLimitSchema,
  })
  .transform(({ date, time, ...values }) => ({
    ...values,
    startsAt: luandaDateTime(date, time),
  }));

export type NewEventFormValues = z.input<typeof newEventSchema>;
export type NewEventData = z.output<typeof newEventSchema>;
