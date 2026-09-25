import type { FilterableGuest } from '@/lib/guests/filters';

/** A guest's answer as the dashboard shows it. */
export interface GuestAnswer {
  /** null: no answer (only a WhatsApp tap, or cleared by the couple). */
  attending: boolean | null;
  peopleCount: number | null;
  companionNames: string[];
  message: string | null;
  source: 'FORM' | 'WHATSAPP_CLICK' | 'COUPLE';
  updatedAt: string;
  whatsappIntentAt: string | null;
  whatsappIntentTarget: 'GROOM' | 'BRIDE' | null;
}

/** One guest of the list (JSON-safe: dates as ISO strings). */
export interface GuestListItem extends FilterableGuest {
  id: string;
  displayName: string;
  /** E.164. */
  phone: string | null;
  seatsAllowed: number;
  groupTag: string | null;
  /** The personal invitation link. */
  link: string;
  sentAt: string | null;
  viewCount: number;
  lastOpenedAt: string | null;
  rsvp: GuestAnswer | null;
  createdAt: string;
}

export type GuestErrorCode =
  | 'invalid'
  | 'unauthenticated'
  | 'not-found'
  | 'rate-limited'
  | 'unavailable'
  /** The event's guest limit (plan) is reached. */
  | 'limit'
  /** Fewer seats than people the guest already confirmed. */
  | 'seats';

export interface GuestFieldIssue {
  /** Form field, e.g. "phone". */
  path: string;
  message: string;
}

export type GuestActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: GuestErrorCode; issues?: GuestFieldIssue[]; people?: number };
