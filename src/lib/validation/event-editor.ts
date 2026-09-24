import { z } from 'zod';

import { ICON_KEYS } from '@/components/icons/keys';
import { editor, validation } from '@/i18n/pt-AO';
import { compactIban, formatIban, isValidIban } from '@/lib/iban';
import { isDateInput, isTimeInput, luandaDateTime, onWeddingDay } from '@/lib/luanda-time';
import { fillTemplate } from '@/lib/template';
import { normalizeAngolanPhone } from '@/lib/validation/phone';
import { SECTION_IDS, type SectionSetting } from '@/lib/validation/sections';
import { THEMES, type ThemeId } from '@/themes';
import type { ThemeOverrides } from '@/themes/overrides';

/**
 * The event editor: what the couple edits, validated the same way in the browser and in the Server
 * Action. Form values are plain strings (dates and times in Luanda time, empty = not set);
 * `eventEditorSchema` turns them into `EventEditorData`, ready for the database.
 */

const v = editor.validation;
const tooLong = (max: number) => fillTemplate(v.tooLong, { max: String(max) });
const tooMany = (max: number) => fillTemplate(v.tooMany, { max: String(max) });

export const EDITOR_LIMITS = {
  name: 60,
  parent: 80,
  line: 140,
  message: 1200,
  venueHeading: 60,
  venueName: 100,
  venueDescription: 200,
  address: 160,
  url: 2048,
  timelineLabel: 60,
  rule: 60,
  dressCodeText: 400,
  giftText: 600,
  accountHolder: 80,
  venues: 4,
  timeline: 16,
  rules: 12,
  dressCodeColors: 6,
} as const;
const L = EDITOR_LIMITS;

// ── Placeholders ─────────────────────────────────────────────────────────────
// Couples see Portuguese placeholders; the database keeps the ones the invitation code fills in.

const PLACEHOLDERS = { pessoas: 'seats', local: 'venue', hora: 'time' } as const;

/** "{pessoas}" → "{seats}", "{local}" → "{venue}", "{hora}" → "{time}". */
export function toStoredTemplate(text: string): string {
  return text.replace(/\{(pessoas|local|hora)\}/g, (_, name: keyof typeof PLACEHOLDERS) => {
    return `{${PLACEHOLDERS[name]}}`;
  });
}

/** The reverse, for the editor. */
export function toEditorTemplate(text: string): string {
  return text.replace(/\{(seats|venue|time)\}/g, (_, stored: string) => {
    const entry = Object.entries(PLACEHOLDERS).find(([, value]) => value === stored);
    return `{${entry?.[0] ?? stored}}`;
  });
}

// ── Field schemas ────────────────────────────────────────────────────────────

const line = (max: number) => z.string().trim().max(max, tooLong(max));
const requiredLine = (max: number) => line(max).min(1, v.required);
const multiline = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\r\n?/g, '\n').trim())
    .pipe(z.string().max(max, tooLong(max)));
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, v.color);
const optionalColor = z.union([z.literal(''), hexColor], { error: v.color });
const date = z.string().refine(isDateInput, v.date);
const optionalDate = z.string().refine((value) => value === '' || isDateInput(value), v.date);
const time = z.string().refine(isTimeInput, v.time);
const optionalTime = z.string().refine((value) => value === '' || isTimeInput(value), v.time);
const optionalPhone = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || normalizeAngolanPhone(value) !== null,
    validation.phone.invalid,
  );
const optionalUrl = z
  .string()
  .trim()
  .max(L.url, tooLong(L.url))
  .refine((value) => value === '' || /^https?:\/\/[^\s]+$/i.test(value), v.url);
const coordinate = (limit: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true;
      const number = Number(value);
      return Number.isFinite(number) && Math.abs(number) <= limit;
    }, message);
const themeIds = Object.keys(THEMES) as [ThemeId, ...ThemeId[]];

export const venueSchema = z
  .object({
    heading: requiredLine(L.venueHeading),
    venueName: requiredLine(L.venueName),
    time,
    description: line(L.venueDescription),
    address: line(L.address),
    mapsUrl: optionalUrl,
    latitude: coordinate(90, v.latitude),
    longitude: coordinate(180, v.longitude),
  })
  .refine((venue) => (venue.latitude === '') === (venue.longitude === ''), {
    message: v.coordinatesPair,
    path: ['longitude'],
  });

export const timelineItemSchema = z.object({
  label: requiredLine(L.timelineLabel),
  time: optionalTime,
  icon: z.enum(ICON_KEYS),
});

export const ruleSchema = z.object({
  text: requiredLine(L.rule),
  icon: z.enum(ICON_KEYS),
});

const sectionsSchema = z
  .array(z.object({ id: z.enum(SECTION_IDS), visible: z.boolean() }))
  .length(SECTION_IDS.length)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, {
    message: v.duplicateSection,
  });

/** Every editable field, validated on its own (the live preview uses them one by one). */
export const editorFields = {
  phase: z.enum(['SAVE_THE_DATE', 'INVITATION']),
  themeId: z.enum(themeIds),
  colors: z.object({
    background: optionalColor,
    ink: optionalColor,
    script: optionalColor,
    accent: optionalColor,
  }),
  sections: sectionsSchema,
  groomName: requiredLine(L.name),
  brideName: requiredLine(L.name),
  groomParents: z.array(line(L.parent)).max(2),
  brideParents: z.array(line(L.parent)).max(2),
  monogram: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\p{L}{1,2}$/u.test(value), v.monogram),
  introLine: line(L.line),
  invitationLine: line(L.line),
  celebrationLine: line(L.line),
  infoBoxText: line(L.line),
  date,
  startTime: time,
  endTime: optionalTime,
  venues: z.array(venueSchema).max(L.venues, tooMany(L.venues)),
  timeline: z.array(timelineItemSchema).max(L.timeline, tooMany(L.timeline)),
  coupleMessage: multiline(L.message),
  dressCodeText: multiline(L.dressCodeText),
  dressCodeColors: z.array(hexColor).max(L.dressCodeColors, tooMany(L.dressCodeColors)),
  rules: z.array(ruleSchema).max(L.rules, tooMany(L.rules)),
  giftText: multiline(L.giftText),
  giftIban: z
    .string()
    .trim()
    .refine((value) => value === '' || isValidIban(value), v.iban),
  giftAccountHolder: line(L.accountHolder),
  rsvpMode: z.enum(['WHATSAPP', 'FORM', 'BOTH']),
  groomWhatsapp: optionalPhone,
  brideWhatsapp: optionalPhone,
  rsvpDeadline: optionalDate,
};

export const editorValuesSchema = z.object(editorFields);

/** What the form holds (strings, as typed). */
export type EventEditorValues = z.input<typeof editorValuesSchema>;
type ParsedValues = z.output<typeof editorValuesSchema>;

// ── Normalized data ──────────────────────────────────────────────────────────

export interface EventEditorData {
  phase: 'SAVE_THE_DATE' | 'INVITATION';
  themeId: ThemeId;
  themeOverrides: ThemeOverrides | null;
  sectionConfig: SectionSetting[];
  groomName: string;
  brideName: string;
  groomParents: string[];
  brideParents: string[];
  monogram: string | null;
  introLine: string | null;
  invitationLine: string | null;
  celebrationLine: string | null;
  infoBoxText: string | null;
  startsAt: Date;
  endsAt: Date | null;
  locations: {
    heading: string;
    venueName: string;
    description: string | null;
    startsAt: Date;
    address: string | null;
    mapsUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  }[];
  timelineItems: { label: string; startsAt: Date | null; icon: string }[];
  guestRules: { text: string; icon: string }[];
  coupleMessage: string | null;
  dressCodeText: string | null;
  dressCodeColors: string[];
  giftText: string | null;
  giftIban: string | null;
  giftAccountHolder: string | null;
  rsvpMode: 'WHATSAPP' | 'FORM' | 'BOTH';
  rsvpDeadline: Date | null;
  groomWhatsapp: string | null;
  brideWhatsapp: string | null;
}

const orNull = (value: string) => (value === '' ? null : value);
const phoneOrNull = (value: string) => (value === '' ? null : normalizeAngolanPhone(value));

/** Validated form values → database-ready data (UTC instants, nulls for "use the default"). */
export function toEditorData(values: ParsedValues): EventEditorData {
  const colors = Object.fromEntries(
    Object.entries(values.colors)
      .filter(([, color]) => color !== '')
      .map(([role, color]) => [role, color.toLowerCase()]),
  );
  return {
    phase: values.phase,
    themeId: values.themeId,
    themeOverrides: Object.keys(colors).length > 0 ? { colors } : null,
    // The invitation card carries the guest's name: it is always shown.
    sectionConfig: values.sections.map((section) =>
      section.id === 'invitation' ? { ...section, visible: true } : section,
    ),
    groomName: values.groomName,
    brideName: values.brideName,
    groomParents: values.groomParents.filter(Boolean),
    brideParents: values.brideParents.filter(Boolean),
    monogram: orNull(values.monogram.toLocaleUpperCase('pt-AO')),
    introLine: orNull(values.introLine),
    invitationLine: orNull(values.invitationLine),
    celebrationLine: orNull(values.celebrationLine),
    infoBoxText: orNull(toStoredTemplate(values.infoBoxText)),
    startsAt: luandaDateTime(values.date, values.startTime),
    endsAt: values.endTime ? onWeddingDay(values.date, values.endTime) : null,
    locations: values.venues.map((venue) => ({
      heading: venue.heading,
      venueName: venue.venueName,
      description: orNull(toStoredTemplate(venue.description)),
      startsAt: onWeddingDay(values.date, venue.time),
      address: orNull(venue.address),
      mapsUrl: orNull(venue.mapsUrl),
      latitude: venue.latitude === '' ? null : Number(venue.latitude),
      longitude: venue.longitude === '' ? null : Number(venue.longitude),
    })),
    timelineItems: values.timeline.map((item) => ({
      label: item.label,
      startsAt: item.time ? onWeddingDay(values.date, item.time) : null,
      icon: item.icon,
    })),
    guestRules: values.rules.map((rule) => ({ text: rule.text, icon: rule.icon })),
    coupleMessage: orNull(values.coupleMessage),
    dressCodeText: orNull(values.dressCodeText),
    dressCodeColors: values.dressCodeColors.map((color) => color.toLowerCase()),
    giftText: orNull(values.giftText),
    giftIban: values.giftIban === '' ? null : formatIban(compactIban(values.giftIban)),
    giftAccountHolder: orNull(values.giftAccountHolder),
    rsvpMode: values.rsvpMode,
    rsvpDeadline: values.rsvpDeadline ? luandaDateTime(values.rsvpDeadline, '23:59') : null,
    groomWhatsapp: phoneOrNull(values.groomWhatsapp),
    brideWhatsapp: phoneOrNull(values.brideWhatsapp),
  };
}

/** Rules between fields (only checked when saving; the live preview shows any valid field). */
function checkConsistency(values: ParsedValues, ctx: z.RefinementCtx): void {
  if (values.rsvpMode !== 'FORM' && !values.groomWhatsapp && !values.brideWhatsapp) {
    ctx.addIssue({ code: 'custom', path: ['groomWhatsapp'], message: v.whatsappNeeded });
  }
  if (values.rsvpDeadline && values.rsvpDeadline > values.date) {
    ctx.addIssue({ code: 'custom', path: ['rsvpDeadline'], message: v.deadlineAfterEvent });
  }
  if (
    values.endTime &&
    onWeddingDay(values.date, values.endTime) <= luandaDateTime(values.date, values.startTime)
  ) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: v.endBeforeStart });
  }
}

/** Saving: every field, the rules between them, then the normalized data. */
export const eventEditorSchema = editorValuesSchema
  .superRefine(checkConsistency)
  .transform(toEditorData);

// ── Live preview ─────────────────────────────────────────────────────────────

type FieldName = keyof typeof editorFields;

const LIST_ITEMS: Partial<Record<FieldName, z.ZodType>> = {
  venues: venueSchema,
  timeline: timelineItemSchema,
  rules: ruleSchema,
  dressCodeColors: hexColor,
};

/** A list without its invalid items; any other value as it is. */
function withoutInvalidItems(name: FieldName, value: unknown): unknown {
  const itemSchema = LIST_ITEMS[name];
  return itemSchema && Array.isArray(value)
    ? value.filter((item) => itemSchema.safeParse(item).success)
    : value;
}

/**
 * The live preview's reading of unsaved form values, field by field: the draft's value when it is
 * valid (half-typed times, empty venue names… are not), else the saved one, else nothing (for
 * optional texts and lists, e.g. an IBAN saved before it was validated). Invalid list items are
 * left out. Returns null when the values are not an object or a required field has no valid value.
 */
export function parseEditorDraft(raw: unknown, saved: EventEditorValues): EventEditorData | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...saved };

  for (const name of Object.keys(editorFields) as FieldName[]) {
    const empty = Array.isArray(saved[name])
      ? []
      : typeof saved[name] === 'string'
        ? ''
        : undefined;
    const candidates = [
      withoutInvalidItems(name, input[name]),
      withoutInvalidItems(name, saved[name]),
      empty,
    ];
    const valid = candidates.find(
      (candidate) => candidate !== undefined && editorFields[name].safeParse(candidate).success,
    );
    if (valid !== undefined) merged[name] = valid;
  }

  const parsed = editorValuesSchema.safeParse(merged);
  return parsed.success ? toEditorData(parsed.data) : null;
}
