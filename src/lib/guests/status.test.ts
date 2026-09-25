import { describe, expect, it } from 'vitest';

import {
  answerStatus,
  confirmedPeople,
  type GuestActivity,
  guestStats,
  guestStatus,
} from '@/lib/guests/status';

function guest(change: Partial<GuestActivity> = {}): GuestActivity {
  return { seatsAllowed: 2, sentAt: null, viewCount: 0, rsvp: null, ...change };
}

const answer = (
  attending: boolean | null,
  peopleCount: number | null = null,
  whatsappIntentAt: string | null = null,
) => ({ attending, peopleCount, whatsappIntentAt });

describe('guest status', () => {
  it('follows the answer first', () => {
    expect(guestStatus(guest({ rsvp: answer(true, 2), viewCount: 3 }))).toBe('confirmed');
    expect(guestStatus(guest({ rsvp: answer(false, 0) }))).toBe('declined');
    expect(guestStatus(guest({ rsvp: answer(null, null, '2026-09-20T12:00:00Z') }))).toBe(
      'whatsapp',
    );
  });

  it('keeps a form answer over a later WhatsApp tap', () => {
    expect(answerStatus(guest({ rsvp: answer(true, 1, '2026-09-20T12:00:00Z') }))).toBe(
      'confirmed',
    );
  });

  it('without an answer, tells opened from not opened', () => {
    expect(guestStatus(guest({ viewCount: 1 }))).toBe('opened');
    expect(guestStatus(guest())).toBe('not-opened');
    // An answer cleared by the couple counts as no answer.
    expect(guestStatus(guest({ rsvp: answer(null), viewCount: 2 }))).toBe('opened');
  });

  it('counts confirmed people, never more than the seats', () => {
    expect(confirmedPeople(guest({ rsvp: answer(true, 2) }))).toBe(2);
    expect(confirmedPeople(guest({ seatsAllowed: 1, rsvp: answer(true, 3) }))).toBe(1);
    expect(confirmedPeople(guest({ seatsAllowed: 3, rsvp: answer(true, null) }))).toBe(3);
    expect(confirmedPeople(guest({ rsvp: answer(false, 0) }))).toBe(0);
  });
});

describe('guest stats', () => {
  it('adds up every guest; answers and pending make up the whole list', () => {
    const stats = guestStats([
      guest({ seatsAllowed: 4, sentAt: '2026-09-17', viewCount: 2, rsvp: answer(true, 3) }),
      guest({ seatsAllowed: 1, sentAt: '2026-09-17', viewCount: 1, rsvp: answer(false, 0) }),
      guest({ viewCount: 1, rsvp: answer(null, null, '2026-09-20') }),
      guest({ sentAt: new Date('2026-09-18'), viewCount: 4 }),
      guest({ seatsAllowed: 3 }),
    ]);
    expect(stats).toEqual({
      invited: 5,
      seats: 12,
      sent: 3,
      opened: 4,
      confirmed: 1,
      declined: 1,
      whatsapp: 1,
      pending: 2,
      people: 3,
    });
    expect(stats.confirmed + stats.declined + stats.whatsapp + stats.pending).toBe(stats.invited);
  });

  it('is all zeros without guests', () => {
    expect(Object.values(guestStats([])).every((value) => value === 0)).toBe(true);
  });
});
