import 'server-only';

import type { InvitationEvent } from '@/features/invitation/types';
import { Prisma } from '@/generated/prisma/client';
import { toLuandaDateInput, toLuandaTimeInput } from '@/lib/luanda-time';
import {
  type EventEditorData,
  type EventEditorValues,
  parseEditorDraft,
  toEditorTemplate,
} from '@/lib/validation/event-editor';
import { formatAngolanPhone } from '@/lib/validation/phone';
import { parseSectionConfig } from '@/lib/validation/sections';
import { cacheDelete, cacheGet, KEY_PREFIX } from '@/server/cache/json-cache';
import { getPrisma } from '@/server/db/prisma';
import {
  invitationEventSelect,
  type InvitationEventRow,
  toInvitationEvent,
} from '@/server/invitations/mapper';
import { invalidateInvitationEvent } from '@/server/invitations/queries';
import { withRedis } from '@/server/redis';
import { DEFAULT_THEME_ID, isThemeId } from '@/themes';
import { parseThemeOverrides } from '@/themes/overrides';

/**
 * The event editor's data: loading the form, saving it, and the live preview's drafts.
 * The editor edits exactly what guests see, so it reads the same row as the guest page
 * (`invitationEventSelect`) and the preview goes through the same mapper.
 */

export async function loadEventRow(eventId: string): Promise<InvitationEventRow | null> {
  return getPrisma().event.findUnique({ where: { id: eventId }, select: invitationEventSelect });
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const pair = (names: string[]): string[] => [names[0] ?? '', names[1] ?? ''];

/** `Event.sectionConfig` as plain JSON objects. */
function sectionsAsJson(sections: EventEditorData['sectionConfig']) {
  return sections.map(({ id, visible }) => ({ id, visible }));
}

/** The database row as form values (Luanda dates and times, '' for "not set"). */
export function toEditorValues(row: InvitationEventRow): EventEditorValues {
  const colors = parseThemeOverrides(row.themeOverrides).colors ?? {};
  return {
    phase: row.phase,
    themeId: isThemeId(row.themeId) ? row.themeId : DEFAULT_THEME_ID,
    colors: {
      background: colors.background ?? '',
      ink: colors.ink ?? '',
      script: colors.script ?? '',
      accent: colors.accent ?? '',
    },
    sections: parseSectionConfig(row.sectionConfig),
    groomName: row.groomName,
    brideName: row.brideName,
    groomParents: pair(row.groomParents),
    brideParents: pair(row.brideParents),
    monogram: row.monogram ?? '',
    introLine: row.introLine ?? '',
    invitationLine: row.invitationLine ?? '',
    celebrationLine: row.celebrationLine ?? '',
    infoBoxText: row.infoBoxText ? toEditorTemplate(row.infoBoxText) : '',
    date: toLuandaDateInput(row.startsAt),
    startTime: toLuandaTimeInput(row.startsAt),
    endTime: row.endsAt ? toLuandaTimeInput(row.endsAt) : '',
    venues: row.locations.map((location) => ({
      heading: location.heading,
      venueName: location.venueName,
      time: toLuandaTimeInput(location.startsAt),
      description: location.description ? toEditorTemplate(location.description) : '',
      address: location.address ?? '',
      mapsUrl: location.mapsUrl ?? '',
      latitude: location.latitude === null ? '' : String(location.latitude),
      longitude: location.longitude === null ? '' : String(location.longitude),
    })),
    timeline: row.timelineItems.map((item) => ({
      label: item.label,
      time: item.startsAt ? toLuandaTimeInput(item.startsAt) : '',
      icon: item.icon as EventEditorValues['timeline'][number]['icon'],
    })),
    coupleMessage: row.coupleMessage ?? '',
    dressCodeText: row.dressCodeText ?? '',
    dressCodeColors: row.dressCodeColors.filter((color) => HEX_COLOR.test(color)),
    rules: row.guestRules.map((rule) => ({
      text: rule.text,
      icon: rule.icon as EventEditorValues['rules'][number]['icon'],
    })),
    giftText: row.giftText ?? '',
    giftIban: row.giftIban ?? '',
    giftAccountHolder: row.giftAccountHolder ?? '',
    rsvpMode: row.rsvpMode,
    groomWhatsapp: row.groomWhatsapp ? formatAngolanPhone(row.groomWhatsapp) : '',
    brideWhatsapp: row.brideWhatsapp ? formatAngolanPhone(row.brideWhatsapp) : '',
    rsvpDeadline: row.rsvpDeadline ? toLuandaDateInput(row.rsvpDeadline) : '',
  };
}

/** Saves the whole editor in one transaction, then refreshes the guests' cached copy. */
export async function saveEventEditorData(
  event: { id: string; slug: string },
  data: EventEditorData,
): Promise<void> {
  const { locations, timelineItems, guestRules, themeOverrides, sectionConfig, ...fields } = data;
  await getPrisma().$transaction(async (tx) => {
    await tx.event.update({
      where: { id: event.id },
      data: {
        ...fields,
        themeOverrides: themeOverrides ?? Prisma.DbNull,
        sectionConfig: sectionsAsJson(sectionConfig),
      },
    });
    await tx.eventLocation.deleteMany({ where: { eventId: event.id } });
    await tx.eventLocation.createMany({
      data: locations.map((location, position) => ({ ...location, eventId: event.id, position })),
    });
    await tx.timelineItem.deleteMany({ where: { eventId: event.id } });
    await tx.timelineItem.createMany({
      data: timelineItems.map((item, position) => ({ ...item, eventId: event.id, position })),
    });
    await tx.guestRule.deleteMany({ where: { eventId: event.id } });
    await tx.guestRule.createMany({
      data: guestRules.map((rule, position) => ({ ...rule, eventId: event.id, position })),
    });
  });
  await invalidateInvitationEvent(event.slug);
}

// ── Live preview drafts ──────────────────────────────────────────────────────

/** Unsaved form values live in Redis for 2 hours, per event and user. */
const DRAFT_TTL_SECONDS = 2 * 60 * 60;
export const DRAFT_MAX_BYTES = 100_000;

const draftKey = (eventId: string, userId: string) => `draft:${eventId}:${userId}`;

/** Stores the draft; false when Redis is unavailable (the preview then shows the saved version). */
export async function savePreviewDraftValues(
  eventId: string,
  userId: string,
  values: unknown,
): Promise<boolean> {
  return withRedis(
    'preview draft',
    async (redis) => {
      await redis.set(
        KEY_PREFIX + draftKey(eventId, userId),
        JSON.stringify(values),
        'EX',
        DRAFT_TTL_SECONDS,
      );
      return true;
    },
    false,
  );
}

export async function deletePreviewDraft(eventId: string, userId: string): Promise<void> {
  await cacheDelete([draftKey(eventId, userId)]);
}

/** The saved event with this user's unsaved changes on top (when Redis has them). */
export async function loadPreviewEvent(
  eventId: string,
  userId: string,
): Promise<InvitationEvent | null> {
  const [row, draft] = await Promise.all([
    loadEventRow(eventId),
    cacheGet<unknown>(draftKey(eventId, userId)),
  ]);
  if (!row) return null;
  const data = draft === undefined ? null : parseEditorDraft(draft, toEditorValues(row));
  return toInvitationEvent(data ? applyEditorData(row, data) : row);
}

/** The row as it would be after saving `data` (media and identifiers unchanged). */
export function applyEditorData(
  row: InvitationEventRow,
  data: EventEditorData,
): InvitationEventRow {
  const { locations, timelineItems, guestRules, sectionConfig, ...fields } = data;
  return {
    ...row,
    ...fields,
    sectionConfig: sectionsAsJson(sectionConfig),
    locations: locations.map((location) => ({ ...location })),
    timelineItems: timelineItems.map((item) => ({ ...item })),
    guestRules: guestRules.map((rule) => ({ ...rule })),
  };
}
