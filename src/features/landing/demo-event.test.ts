import { describe, expect, it } from 'vitest';

import { sectionsToShow } from '@/features/invitation/sections';
import { formatInvitationWeekdayTime } from '@/i18n/format';
import { SECTION_IDS } from '@/lib/validation/sections';
import { THEMES, type ThemeId } from '@/themes';

import { DEMO_GUEST, demoInvitation, demoWeddingDate } from './demo-event';

const DAY = 24 * 60 * 60 * 1000;

describe('the demo wedding date', () => {
  it('is the first Saturday at least 120 days ahead, at 16h00 in Luanda', () => {
    // Saturday 26 September 2026 + 120 days = Sunday 24 January 2027 → Saturday the 30th.
    expect(demoWeddingDate(new Date('2026-09-26T10:00:00Z')).toISOString()).toBe(
      '2027-01-30T15:00:00.000Z',
    );
    // Friday the 25th + 120 days is a Saturday itself.
    expect(demoWeddingDate(new Date('2026-09-25T10:00:00Z')).toISOString()).toBe(
      '2027-01-23T15:00:00.000Z',
    );
  });

  it("follows Luanda's calendar day, not UTC's", () => {
    // 23h30 UTC on the 25th is already the 26th in Luanda (UTC+1).
    expect(demoWeddingDate(new Date('2026-09-25T23:30:00Z'))).toEqual(
      demoWeddingDate(new Date('2026-09-26T10:00:00Z')),
    );
    expect(demoWeddingDate(new Date('2026-09-25T22:30:00Z'))).toEqual(
      demoWeddingDate(new Date('2026-09-25T10:00:00Z')),
    );
  });

  it('is always a Saturday afternoon, four months or so away', () => {
    const start = new Date('2026-01-01T00:00:00Z').getTime();
    for (let hour = 0; hour < 24 * 60; hour += 7) {
      const now = new Date(start + hour * 60 * 60 * 1000);
      const date = demoWeddingDate(now);
      expect(formatInvitationWeekdayTime(date)).toBe('SÁBADO, ÀS 16H00');
      const daysAhead = (date.getTime() - now.getTime()) / DAY;
      expect(daysAhead).toBeGreaterThan(119);
      expect(daysAhead).toBeLessThan(128);
    }
  });
});

describe('the demo invitation', () => {
  const now = new Date('2026-09-26T10:00:00Z');

  it.each(Object.keys(THEMES) as ThemeId[])('shows every section in the "%s" theme', (themeId) => {
    const { event, guest } = demoInvitation(themeId, now);
    expect(event.themeId).toBe(themeId);
    // Every section has the content it needs to be shown.
    expect(sectionsToShow(event)).toEqual([...SECTION_IDS]);
    expect(guest).toEqual(DEMO_GUEST);
  });

  it('keeps answers open until two weeks before the wedding', () => {
    const { event } = demoInvitation('praia-rosa', now);
    expect(event.rsvp.deadline).not.toBeNull();
    const deadline = new Date(event.rsvp.deadline ?? '');
    expect(deadline.getTime()).toBeGreaterThan(now.getTime());
    expect(new Date(event.startsAt).getTime() - deadline.getTime()).toBe(14 * DAY);
  });

  it('only uses the unassigned demo phone range', () => {
    const { event } = demoInvitation('champanhe', now);
    for (const phone of [event.rsvp.groomWhatsapp, event.rsvp.brideWhatsapp]) {
      expect(phone).toMatch(/^\+244900000\d{3}$/);
    }
  });
});
