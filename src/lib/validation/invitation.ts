import { z } from 'zod';

import { isGuestToken } from '@/lib/guest-token';

/** Event slugs: lowercase words joined by hyphens (also enforced by a database CHECK constraint). */
const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isEventSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 80 && EVENT_SLUG_PATTERN.test(value);
}

/**
 * Route parameters of a guest link, /c/<eventSlug>/<guestToken>: checked before any database
 * lookup so malformed or probing URLs never reach Postgres.
 */
export const invitationParamsSchema = z.object({
  eventSlug: z.string().refine(isEventSlug),
  guestToken: z.string().refine(isGuestToken),
});

export type InvitationParams = z.infer<typeof invitationParamsSchema>;
