import * as z from 'zod/mini';

// Its own module, not the dictionary: this file ships to guests (see src/i18n/pt-AO/index.ts).
import { validation } from '@/i18n/pt-AO/validation';
import { fillTemplate } from '@/lib/template';

/**
 * The RSVP form answer, shared by the browser (React Hook Form) and the Server Action, which
 * re-validates everything with the guest's seats from the database. Built with `zod/mini` to keep
 * the guest page's JavaScript small.
 */

export const NAME_MAX_LENGTH = 80;
export const MESSAGE_MAX_LENGTH = 500;

const t = validation.rsvp;

/**
 * Raw form values, as the inputs hold them: `attending` is "sim", "nao" or "" (nothing chosen
 * yet), `peopleCount` "1" … seats.
 */
export type RsvpFormValues = z.input<ReturnType<typeof rsvpAnswerSchema>>;

/** What is saved: `peopleCount` is 0 and there are no companions when not attending. */
export interface RsvpAnswer {
  attending: boolean;
  peopleCount: number;
  companionNames: string[];
  message: string | null;
}

function isPeopleCount(value: string, seats: number): boolean {
  if (!/^\d{1,3}$/.test(value)) return false;
  const count = Number(value);
  return count >= 1 && count <= seats;
}

/** Validates and normalizes an answer for a guest invited with `seatsAllowed` seats. */
export function rsvpAnswerSchema(seatsAllowed: number) {
  const seats = Math.max(1, Math.floor(seatsAllowed));
  return z.pipe(
    z
      .object({
        // A string, not an enum: the form starts with "" (nothing chosen yet).
        attending: z.string().check(
          z.refine((value) => value === 'sim' || value === 'nao', {
            error: t.attendingRequired,
          }),
        ),
        peopleCount: z.string(),
        companionNames: z
          .array(z.string().check(z.trim(), z.maxLength(NAME_MAX_LENGTH, { error: t.nameTooLong })))
          .check(z.maxLength(seats - 1)),
        message: z
          .string()
          .check(z.trim(), z.maxLength(MESSAGE_MAX_LENGTH, { error: t.messageTooLong })),
      })
      .check(
        z.refine((value) => value.attending !== 'sim' || isPeopleCount(value.peopleCount, seats), {
          error: fillTemplate(t.peopleRange, { max: String(seats) }),
          path: ['peopleCount'],
        }),
      ),
    z.transform((value): RsvpAnswer => {
      const attending = value.attending === 'sim';
      const peopleCount = attending ? Number(value.peopleCount) : 0;
      return {
        attending,
        peopleCount,
        companionNames: attending
          ? value.companionNames.slice(0, peopleCount - 1).filter(Boolean)
          : [],
        message: value.message || null,
      };
    }),
  );
}
