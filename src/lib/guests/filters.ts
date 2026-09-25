import { type AnswerStatus, answerStatus, type GuestActivity } from './status';

/**
 * Filters of the guest list, kept in the URL in Portuguese so a filtered list can be bookmarked
 * and the overview can link to one: `?resposta=confirmados&convite=por-enviar&grupo=Amigos&q=silva`.
 */

export type InviteFilter = 'not-sent' | 'sent' | 'opened' | 'not-opened';

export const ANSWER_PARAMS = {
  confirmed: 'confirmados',
  declined: 'nao-vao',
  whatsapp: 'whatsapp',
  pending: 'sem-resposta',
} as const satisfies Record<AnswerStatus, string>;

export const INVITE_PARAMS = {
  'not-sent': 'por-enviar',
  sent: 'enviados',
  opened: 'abriram',
  'not-opened': 'nao-abriram',
} as const satisfies Record<InviteFilter, string>;

export interface GuestFilters {
  answer: AnswerStatus | null;
  invite: InviteFilter | null;
  group: string | null;
  query: string;
}

export const NO_FILTERS: GuestFilters = { answer: null, invite: null, group: null, query: '' };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function keyOf<K extends string>(map: Record<K, string>, value: string): K | null {
  const entry = Object.entries(map).find(([, param]) => param === value);
  return entry ? (entry[0] as K) : null;
}

export function parseGuestFilters(params: SearchParams): GuestFilters {
  const group = first(params.grupo).trim().slice(0, 80);
  return {
    answer: keyOf(ANSWER_PARAMS, first(params.resposta)),
    invite: keyOf(INVITE_PARAMS, first(params.convite)),
    group: group || null,
    query: first(params.q).slice(0, 80),
  };
}

/** The query string for these filters ("" without any). */
export function guestFilterQuery(filters: Partial<GuestFilters>): string {
  const params = new URLSearchParams();
  if (filters.answer) params.set('resposta', ANSWER_PARAMS[filters.answer]);
  if (filters.invite) params.set('convite', INVITE_PARAMS[filters.invite]);
  if (filters.group) params.set('grupo', filters.group);
  if (filters.query?.trim()) params.set('q', filters.query.trim());
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Lowercase without accents: "Família" matches "familia". */
export function searchKey(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt');
}

export interface FilterableGuest extends GuestActivity {
  displayName: string;
  phone: string | null;
  groupTag: string | null;
}

function matchesInvite(guest: GuestActivity, invite: InviteFilter): boolean {
  switch (invite) {
    case 'sent':
      return guest.sentAt !== null;
    case 'not-sent':
      return guest.sentAt === null;
    case 'opened':
      return guest.viewCount > 0;
    case 'not-opened':
      return guest.viewCount === 0;
  }
}

function matchesQuery(guest: FilterableGuest, query: string): boolean {
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const name = searchKey(guest.displayName);
  const digits = query.replace(/\D/g, '');
  // "923 456" finds +244923456789; a name search never matches phone digits by accident.
  if (digits.length >= 3 && guest.phone?.replace(/\D/g, '').includes(digits)) return true;
  return words.every((word) => name.includes(word));
}

/** Alphabetical order of the list and the export ("Ana" = "ana", accents after plain letters). */
export function compareGuestNames(a: { displayName: string }, b: { displayName: string }): number {
  return a.displayName.localeCompare(b.displayName, 'pt', { sensitivity: 'base' });
}

/** The groups in use, alphabetically (filters and the group field's suggestions). */
export function guestGroups(list: readonly { groupTag: string | null }[]): string[] {
  const groups = new Set<string>();
  for (const guest of list) if (guest.groupTag) groups.add(guest.groupTag);
  return [...groups].sort((a, b) => a.localeCompare(b, 'pt'));
}

export function matchesGuestFilters(guest: FilterableGuest, filters: GuestFilters): boolean {
  if (filters.answer && answerStatus(guest) !== filters.answer) return false;
  if (filters.invite && !matchesInvite(guest, filters.invite)) return false;
  if (filters.group && guest.groupTag !== filters.group) return false;
  return matchesQuery(guest, filters.query);
}
