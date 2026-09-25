/**
 * Where each guest stands, in one place: the guest list, the overview and the CSV export all use
 * these functions, so their numbers always agree. Plain data in, plain data out (browser-safe).
 */

/** The guest's answer. "whatsapp": tapped a WhatsApp confirmation button, nothing recorded yet. */
export type AnswerStatus = 'confirmed' | 'declined' | 'whatsapp' | 'pending';

/** One word per guest: the answer, or whether an unanswered invitation was opened. */
export type GuestStatus = 'confirmed' | 'declined' | 'whatsapp' | 'opened' | 'not-opened';

export interface GuestActivity {
  seatsAllowed: number;
  /** When the couple sent (or marked as sent) the link; null = not yet. */
  sentAt: string | Date | null;
  viewCount: number;
  rsvp: {
    attending: boolean | null;
    peopleCount: number | null;
    whatsappIntentAt: string | Date | null;
  } | null;
}

export function answerStatus(guest: Pick<GuestActivity, 'rsvp'>): AnswerStatus {
  const { rsvp } = guest;
  if (rsvp?.attending === true) return 'confirmed';
  if (rsvp?.attending === false) return 'declined';
  if (rsvp?.whatsappIntentAt) return 'whatsapp';
  return 'pending';
}

export function guestStatus(guest: Pick<GuestActivity, 'rsvp' | 'viewCount'>): GuestStatus {
  const answer = answerStatus(guest);
  if (answer !== 'pending') return answer;
  return guest.viewCount > 0 ? 'opened' : 'not-opened';
}

/** People who confirmed (never more than the seats, even for an old answer). */
export function confirmedPeople(guest: Pick<GuestActivity, 'rsvp' | 'seatsAllowed'>): number {
  if (guest.rsvp?.attending !== true) return 0;
  return Math.min(guest.rsvp.peopleCount ?? guest.seatsAllowed, guest.seatsAllowed);
}

export interface GuestStats {
  /** Guests on the list. */
  invited: number;
  /** Seats given out (the most people who could come). */
  seats: number;
  sent: number;
  /** Opened the invitation at least once. */
  opened: number;
  confirmed: number;
  declined: number;
  whatsapp: number;
  /** No answer yet (neither form nor recorded answer nor WhatsApp tap). */
  pending: number;
  /** People attending, over every confirmed guest. */
  people: number;
}

export function guestStats(list: readonly GuestActivity[]): GuestStats {
  const stats: GuestStats = {
    invited: 0,
    seats: 0,
    sent: 0,
    opened: 0,
    confirmed: 0,
    declined: 0,
    whatsapp: 0,
    pending: 0,
    people: 0,
  };
  for (const guest of list) {
    stats.invited += 1;
    stats.seats += guest.seatsAllowed;
    if (guest.sentAt) stats.sent += 1;
    if (guest.viewCount > 0) stats.opened += 1;
    stats[answerStatus(guest)] += 1;
    stats.people += confirmedPeople(guest);
  }
  return stats;
}
