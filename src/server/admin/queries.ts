import 'server-only';

import { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import type { AccountListFilters, EventListFilters } from '@/lib/admin/filters';
import { toUserRole } from '@/lib/auth/roles';
import { getPrisma } from '@/server/db/prisma';

/** What the admin area lists and shows. Callers have checked that the user is an admin. */

export const ADMIN_PAGE_SIZE = 20;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

function paginate(page: number, total: number): { skip: number; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const current = Math.min(page, pages);
  return { skip: (current - 1) * ADMIN_PAGE_SIZE, page: current, pages };
}

const contains = (query: string) => ({ contains: query, mode: 'insensitive' as const });

/** Not suspended: the admin plugin's `banned` is null for accounts created before it. */
const notBanned = { OR: [{ banned: false }, { banned: null }] } satisfies Prisma.UserWhereInput;

// ── Events ───────────────────────────────────────────────────────────────────

const eventListSelect = {
  id: true,
  slug: true,
  groomName: true,
  brideName: true,
  startsAt: true,
  phase: true,
  themeId: true,
  isActive: true,
  guestLimit: true,
  createdAt: true,
  owner: { select: { id: true, name: true, email: true, banned: true } },
  _count: { select: { guests: true } },
} satisfies Prisma.EventSelect;

export type AdminEventRow = Prisma.EventGetPayload<{ select: typeof eventListSelect }>;

/** Every event, newest first; the search matches the couple, the slug and the account. */
export async function listAdminEvents(filters: EventListFilters): Promise<Page<AdminEventRow>> {
  const prisma = getPrisma();
  const words = filters.query.split(' ').filter(Boolean);
  const where: Prisma.EventWhereInput = {
    ...(filters.status ? { isActive: filters.status === 'active' } : {}),
    AND: words.map((word) => ({
      OR: [
        { groomName: contains(word) },
        { brideName: contains(word) },
        { slug: contains(word) },
        { owner: { email: contains(word) } },
        { owner: { name: contains(word) } },
      ],
    })),
  };
  const total = await prisma.event.count({ where });
  const { skip, page, pages } = paginate(filters.page, total);
  const items = await prisma.event.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: ADMIN_PAGE_SIZE,
    select: eventListSelect,
  });
  return { items, total, page, pages };
}

const eventIdSchema = z.uuid();

/** One event with its account and counts; null for a missing event or a malformed ID. */
export async function loadAdminEvent(eventId: string) {
  const id = eventIdSchema.safeParse(eventId);
  if (!id.success) return null;
  const prisma = getPrisma();
  const [event, people] = await Promise.all([
    prisma.event.findUnique({ where: { id: id.data }, select: eventListSelect }),
    prisma.rsvp.aggregate({
      where: { guest: { eventId: id.data }, attending: true },
      _sum: { peopleCount: true },
    }),
  ]);
  return event ? { ...event, confirmedPeople: people._sum.peopleCount ?? 0 } : null;
}

export type AdminEventDetail = NonNullable<Awaited<ReturnType<typeof loadAdminEvent>>>;

// ── Accounts ─────────────────────────────────────────────────────────────────

const accountListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  banned: true,
  createdAt: true,
  _count: { select: { events: true } },
} satisfies Prisma.UserSelect;

type AccountRow = Prisma.UserGetPayload<{ select: typeof accountListSelect }>;

function toAccount(row: AccountRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: toUserRole(row.role),
    suspended: row.banned === true,
    createdAt: row.createdAt,
    eventCount: row._count.events,
  };
}

export type AdminAccount = ReturnType<typeof toAccount>;

/** Every account (couples and admins), newest first; the search matches name and e-mail. */
export async function listAccounts(filters: AccountListFilters): Promise<Page<AdminAccount>> {
  const prisma = getPrisma();
  const words = filters.query.split(' ').filter(Boolean);
  const where: Prisma.UserWhereInput = {
    AND: [
      ...(filters.status === 'suspended' ? [{ banned: true }] : []),
      ...(filters.status === 'active' ? [notBanned] : []),
      ...words.map((word) => ({ OR: [{ name: contains(word) }, { email: contains(word) }] })),
    ],
  };
  const total = await prisma.user.count({ where });
  const { skip, page, pages } = paginate(filters.page, total);
  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: ADMIN_PAGE_SIZE,
    select: accountListSelect,
  });
  return { items: rows.map(toAccount), total, page, pages };
}

/** One account with its events; null when missing. */
export async function loadAccount(userId: string) {
  if (!/^[A-Za-z0-9-]{1,64}$/.test(userId)) return null;
  const row = await getPrisma().user.findUnique({
    where: { id: userId },
    select: {
      ...accountListSelect,
      events: {
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          slug: true,
          groomName: true,
          brideName: true,
          startsAt: true,
          isActive: true,
          phase: true,
        },
      },
    },
  });
  return row ? { ...toAccount(row), events: row.events } : null;
}

export type AdminAccountDetail = NonNullable<Awaited<ReturnType<typeof loadAccount>>>;

/** Accounts a new event can belong to: active couples, by name. */
export async function listEventOwners(): Promise<{ id: string; name: string; email: string }[]> {
  return getPrisma().user.findMany({
    where: { role: 'couple', ...notBanned },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    take: 1000,
    select: { id: true, name: true, email: true },
  });
}
