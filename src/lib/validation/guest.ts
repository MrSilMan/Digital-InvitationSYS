import { z } from 'zod';

import { editor, guests, validation } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import { normalizeGuestPhone } from '@/lib/validation/phone';

/**
 * A guest as the couple enters it, validated the same way in the dashboard form, the Server
 * Actions and every CSV row (Phase 8b). Values are plain strings, as inputs and CSV cells hold
 * them; `guestSchema` turns them into `GuestData`, ready for the database.
 */

export const GUEST_LIMITS = {
  name: 80,
  group: 40,
  /** What people type, before normalizing (spaces, brackets…). */
  phoneInput: 40,
  seats: 20,
  inviteMessage: 1000,
} as const;
const L = GUEST_LIMITS;

const tooLong = (max: number) => fillTemplate(editor.validation.tooLong, { max: String(max) });

/** Trims and collapses runs of spaces, so "Família  Silva " and "Família Silva" are one name. */
export const collapseSpaces = (value: string) => value.replace(/\s+/g, ' ').trim();

const displayName = z
  .string()
  .transform(collapseSpaces)
  .pipe(z.string().min(1, editor.validation.required).max(L.name, tooLong(L.name)));

const phone = z
  .string()
  .trim()
  .max(L.phoneInput, validation.phone.invalidGuest)
  .transform((value, ctx) => {
    if (value === '') return null;
    const normalized = normalizeGuestPhone(value);
    if (normalized) return normalized;
    ctx.addIssue({ code: 'custom', message: validation.phone.invalidGuest });
    return z.NEVER;
  });

/** A whole number from 1 to `max`, typed or chosen as text. */
export function countSchema(max: number, message: string) {
  return z
    .string()
    .trim()
    .refine((value) => /^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= max, {
      message,
    })
    .transform(Number);
}

const seats = countSchema(
  L.seats,
  fillTemplate(guests.validation.seatsRange, { max: String(L.seats) }),
);

const groupTag = z
  .string()
  .transform(collapseSpaces)
  .pipe(z.string().max(L.group, tooLong(L.group)))
  .transform((value) => value || null);

export const guestSchema = z.object({
  displayName,
  phone,
  seatsAllowed: seats,
  groupTag,
});

export type GuestFormValues = z.input<typeof guestSchema>;
export type GuestData = z.output<typeof guestSchema>;

export const EMPTY_GUEST: GuestFormValues = {
  displayName: '',
  phone: '',
  seatsAllowed: '1',
  groupTag: '',
};

// ── An answer recorded by the couple ─────────────────────────────────────────

/** "sim" / "nao", or "" to clear the answer (e.g. recorded by mistake). */
export interface CoupleAnswerValues {
  attending: '' | 'sim' | 'nao';
  peopleCount: string;
}

export interface CoupleAnswer {
  /** null: no answer. */
  attending: boolean | null;
  /** Only when attending. */
  peopleCount: number | null;
}

/** Validates an answer for a guest invited with `seatsAllowed` seats. */
export function coupleAnswerSchema(seatsAllowed: number) {
  const max = Math.max(1, Math.floor(seatsAllowed));
  const people = countSchema(
    max,
    fillTemplate(guests.validation.peopleRange, { max: String(max) }),
  );
  return z
    .object({ attending: z.enum(['', 'sim', 'nao']), peopleCount: z.string() })
    .transform((value, ctx): CoupleAnswer => {
      if (value.attending === '') return { attending: null, peopleCount: null };
      if (value.attending === 'nao') return { attending: false, peopleCount: 0 };
      const count = people.safeParse(value.peopleCount);
      if (count.success) return { attending: true, peopleCount: count.data };
      ctx.addIssue({
        code: 'custom',
        message: count.error.issues[0]?.message ?? '',
        path: ['peopleCount'],
      });
      return z.NEVER;
    });
}

// ── The message sent with each link ──────────────────────────────────────────

const SUGGESTED_MESSAGES: readonly string[] = Object.values(guests.template.defaults);

/**
 * The couple's text. Empty, or one of the suggested texts, is stored as null ("use the suggested
 * text"), so it follows the event's phase (Save the Date → invitation).
 */
export const inviteMessageSchema = z
  .string()
  .transform((value) => value.replace(/\r\n?/g, '\n').trim())
  .pipe(z.string().max(L.inviteMessage, tooLong(L.inviteMessage)))
  .transform((value) => (value && !SUGGESTED_MESSAGES.includes(value) ? value : null));
