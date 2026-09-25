import { type AuditAction, isAuditAction } from '@/lib/audit/actions';

/**
 * Filters of the admin lists, kept in the URL in Portuguese so a filtered list can be bookmarked
 * and pages can link to one: `/admin?q=silva&estado=desativados&pagina=2`,
 * `/admin/registo?acao=event.activate&evento=<id>`.
 */

type SearchParams = Record<string, string | string[] | undefined>;

export const QUERY_MAX_LENGTH = 80;
/** A page number past any real list, so `?pagina=` cannot ask for huge offsets. */
const PAGE_MAX = 10_000;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function keyOf<K extends string>(map: Record<K, string>, value: string): K | null {
  const entry = Object.entries(map).find(([, param]) => param === value);
  return entry ? (entry[0] as K) : null;
}

function parsePage(value: string): number {
  const page = /^\d{1,5}$/.test(value) ? Number(value) : 1;
  return Math.min(Math.max(page, 1), PAGE_MAX);
}

function parseQuery(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, QUERY_MAX_LENGTH);
}

/** "?a=1&b=2", or "" when every value is empty. */
export function toQueryString(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

// ── Events ───────────────────────────────────────────────────────────────────

export type EventStatusFilter = 'active' | 'inactive';

export const EVENT_STATUS_PARAMS = {
  active: 'ativos',
  inactive: 'desativados',
} as const satisfies Record<EventStatusFilter, string>;

export interface EventListFilters {
  query: string;
  status: EventStatusFilter | null;
  page: number;
}

export function parseEventListFilters(params: SearchParams): EventListFilters {
  return {
    query: parseQuery(first(params.q)),
    status: keyOf(EVENT_STATUS_PARAMS, first(params.estado)),
    page: parsePage(first(params.pagina)),
  };
}

export function eventListQuery(filters: Partial<EventListFilters>): string {
  return toQueryString({
    q: filters.query,
    estado: filters.status ? EVENT_STATUS_PARAMS[filters.status] : null,
    pagina: filters.page && filters.page > 1 ? filters.page : null,
  });
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export type AccountStatusFilter = 'active' | 'suspended';

export const ACCOUNT_STATUS_PARAMS = {
  active: 'ativas',
  suspended: 'suspensas',
} as const satisfies Record<AccountStatusFilter, string>;

export interface AccountListFilters {
  query: string;
  status: AccountStatusFilter | null;
  page: number;
}

export function parseAccountListFilters(params: SearchParams): AccountListFilters {
  return {
    query: parseQuery(first(params.q)),
    status: keyOf(ACCOUNT_STATUS_PARAMS, first(params.estado)),
    page: parsePage(first(params.pagina)),
  };
}

export function accountListQuery(filters: Partial<AccountListFilters>): string {
  return toQueryString({
    q: filters.query,
    estado: filters.status ? ACCOUNT_STATUS_PARAMS[filters.status] : null,
    pagina: filters.page && filters.page > 1 ? filters.page : null,
  });
}

// ── Audit log ────────────────────────────────────────────────────────────────

export interface AuditFilters {
  action: AuditAction | null;
  /** Only the entries about one event (`?evento=`) or one account (`?conta=`). */
  target: { type: 'event' | 'user'; id: string } | null;
  page: number;
}

/** Event IDs are UUIDs; account IDs are Better Auth's own (letters, digits, hyphens). */
const TARGET_ID = /^[A-Za-z0-9-]{1,64}$/;

export function parseAuditFilters(params: SearchParams): AuditFilters {
  const action = first(params.acao);
  const eventId = first(params.evento);
  const userId = first(params.conta);
  const target = TARGET_ID.test(eventId)
    ? ({ type: 'event', id: eventId } as const)
    : TARGET_ID.test(userId)
      ? ({ type: 'user', id: userId } as const)
      : null;
  return {
    action: isAuditAction(action) ? action : null,
    target,
    page: parsePage(first(params.pagina)),
  };
}

export function auditQuery(filters: Partial<AuditFilters>): string {
  return toQueryString({
    acao: filters.action,
    evento: filters.target?.type === 'event' ? filters.target.id : null,
    conta: filters.target?.type === 'user' ? filters.target.id : null,
    pagina: filters.page && filters.page > 1 ? filters.page : null,
  });
}
