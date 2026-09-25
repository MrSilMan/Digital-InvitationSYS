import Papa from 'papaparse';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  addGuest,
  editGuest,
  markGuestSent,
  removeGuest,
  renewGuestLink,
  saveGuestAnswer,
  updateInviteMessage,
} from '@/features/dashboard/guests/actions';
import type { GuestListItem } from '@/features/dashboard/guests/types';
import { getPrisma } from '@/server/db/prisma';
import { listGuests } from '@/server/guests/queries';
import { loadOverview } from '@/server/guests/overview';
import { getInvitation } from '@/server/invitations/queries';

import { GET as exportGuests } from '../../app/(dashboard)/painel/eventos/[eventId]/convidados/exportar/route';
import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_EVENT, DEMO_USERS } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';
import { createCouple, sessionCookie } from './sessions';

// Server Actions, Route Handlers and Better Auth read the request headers through next/headers.
let requestHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    set: () => undefined,
    delete: () => undefined,
  }),
}));

const prisma = createTestPrisma();
const passwords = { couplePassword: 'couple-test-pass', adminPassword: 'admin-test-pass' };
const other = { name: 'Outro casal', email: 'outros@convites.test', password: 'outro-casal-pass' };

let eventId: string;
const cookies = { couple: '', admin: '', other: '' };

/** The next action runs as this visitor (or signed out). */
function as(cookie: string | null) {
  requestHeaders = new Headers({
    'x-forwarded-for': '203.0.113.80',
    ...(cookie ? { cookie } : {}),
  });
}

async function guestNamed(displayName: string) {
  return prisma.guest.findFirstOrThrow({
    where: { eventId, displayName },
    include: { rsvp: true },
  });
}

/** The token at the end of a personal link. */
const tokenOf = (guest: Pick<GuestListItem, 'link'>) => guest.link.split('/').at(-1) ?? '';

function exportCsv(query = '') {
  return exportGuests(
    new Request(`http://localhost:3000/painel/eventos/${eventId}/convidados/exportar${query}`),
    { params: Promise.resolve({ eventId }) },
  );
}

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  eventId = (await seedDemo(prisma, passwords)).eventId;
  await connectAppRedis();
  await createCouple(prisma, other);
  cookies.couple = await sessionCookie(DEMO_USERS.couple.email, passwords.couplePassword);
  cookies.admin = await sessionCookie(DEMO_USERS.admin.email, passwords.adminPassword);
  cookies.other = await sessionCookie(other.email, other.password);
});

afterAll(async () => {
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

// First, on the untouched demo data (the other tests change it).
describe('overview', () => {
  it('counts every state of the demo guests', async () => {
    const overview = await loadOverview(eventId, null);
    expect(overview?.stats).toEqual({
      invited: 10,
      seats: 24,
      sent: 9,
      opened: 8,
      confirmed: 4,
      declined: 1,
      whatsapp: 2,
      pending: 3,
      people: 8,
    });
    expect(overview?.groups).toEqual(['Amigos', 'Colegas', 'Família da noiva', 'Família do noivo']);
    const messages = overview?.messages ?? [];
    expect(messages.map((message) => message.displayName).sort()).toEqual([
      'Dra. Luísa Ferreira',
      'Família Silva',
      'Tio Alberto e Tia Rosa',
    ]);
    // Newest first.
    expect(messages.map((message) => message.at.getTime())).toEqual(
      messages.map((message) => message.at.getTime()).sort((a, b) => b - a),
    );
  });

  it('counts one group', async () => {
    const overview = await loadOverview(eventId, 'Amigos');
    expect(overview?.stats).toMatchObject({ invited: 4, confirmed: 2, pending: 2, people: 3 });
    expect(overview?.messages).toEqual([]);
  });
});

describe('guest list CSV export', () => {
  it('downloads the list for the couple, with the same filters as the page', async () => {
    as(cookies.couple);
    const response = await exportCsv();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('content-disposition')).toMatch(
      /^attachment; filename="convidados-braulio-e-nanda-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    // UTF-8 byte order mark (Response.text() and TextDecoder drop it when decoding).
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes);
    const rows = Papa.parse<string[]>(text, { delimiter: ';', skipEmptyLines: true }).data;
    expect(rows).toHaveLength(11);
    expect(rows[1]?.[0]).toBe('Ana e Pedro'); // alphabetical

    const confirmed = await (await exportCsv('?resposta=confirmados')).text();
    expect(confirmed.trim().split('\r\n')).toHaveLength(5);
  });

  it('answers "not found" to other couples and sends visitors to the login', async () => {
    as(cookies.other);
    expect((await exportCsv()).status).toBe(404);
    as(null);
    const response = await exportCsv();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('/entrar?voltar=');
  });
});

describe('adding guests', () => {
  it('adds a guest with a personal link, normalized fields and the group spelling in use', async () => {
    as(cookies.couple);
    const result = await addGuest(eventId, {
      displayName: '  Família   Nova ',
      phone: '+351 912 345 678',
      seatsAllowed: '3',
      groupTag: 'amigos',
    });
    expect(result).toMatchObject({
      ok: true,
      guest: {
        displayName: 'Família Nova',
        phone: '+351912345678',
        seatsAllowed: 3,
        groupTag: 'Amigos',
        sentAt: null,
        viewCount: 0,
        rsvp: null,
      },
    });
    if (!result.ok) return;
    expect(result.guest.link).toMatch(/^http:\/\/localhost:3000\/c\/braulio-e-nanda\/[\w-]{22}$/);
    const invitation = await getInvitation(DEMO_EVENT.slug, tokenOf(result.guest));
    expect(invitation?.guest.displayName).toBe('Família Nova');
  });

  it('reports invalid fields and refuses other couples', async () => {
    as(cookies.couple);
    await expect(
      addGuest(eventId, { displayName: '', phone: '123', seatsAllowed: '1', groupTag: '' }),
    ).resolves.toMatchObject({
      ok: false,
      error: 'invalid',
      issues: [{ path: 'displayName' }, { path: 'phone' }],
    });

    const valid = { displayName: 'Intruso', phone: '', seatsAllowed: '1', groupTag: '' };
    as(cookies.other);
    await expect(addGuest(eventId, valid)).resolves.toEqual({ ok: false, error: 'not-found' });
    as(null);
    await expect(addGuest(eventId, valid)).resolves.toEqual({
      ok: false,
      error: 'unauthenticated',
    });
    expect(await prisma.guest.count({ where: { displayName: 'Intruso' } })).toBe(0);
  });

  it('never passes the guest limit, even with adds at the same time', async () => {
    const count = await prisma.guest.count({ where: { eventId } });
    await prisma.event.update({ where: { id: eventId }, data: { guestLimit: count + 1 } });
    try {
      as(cookies.couple);
      const results = await Promise.all(
        ['Concorrente A', 'Concorrente B', 'Concorrente C'].map((displayName) =>
          addGuest(eventId, { displayName, phone: '', seatsAllowed: '1', groupTag: '' }),
        ),
      );
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.filter((result) => !result.ok)).toEqual([
        { ok: false, error: 'limit' },
        { ok: false, error: 'limit' },
      ]);
      expect(await prisma.guest.count({ where: { eventId } })).toBe(count + 1);
    } finally {
      await prisma.event.update({ where: { id: eventId }, data: { guestLimit: 150 } });
    }
  });
});

describe('editing guests', () => {
  it('updates the guest, and their page shows it at once', async () => {
    const silva = await guestNamed('Família Silva');
    // Cached read model before the change.
    expect((await getInvitation(DEMO_EVENT.slug, silva.token))?.guest.displayName).toBe(
      'Família Silva',
    );

    as(cookies.admin);
    const result = await editGuest(eventId, silva.id, {
      displayName: 'Família Silva Santos',
      phone: '923 000 111',
      seatsAllowed: '5',
      groupTag: 'Família da noiva',
    });
    expect(result).toMatchObject({
      ok: true,
      guest: { displayName: 'Família Silva Santos', phone: '+244923000111', seatsAllowed: 5 },
    });
    const invitation = await getInvitation(DEMO_EVENT.slug, silva.token);
    expect(invitation?.guest).toMatchObject({
      displayName: 'Família Silva Santos',
      seatsAllowed: 5,
    });
  });

  it('keeps the seats at or above the people already confirmed', async () => {
    const silva = await guestNamed('Família Silva Santos');
    as(cookies.couple);
    await expect(
      editGuest(eventId, silva.id, {
        displayName: silva.displayName,
        phone: '',
        seatsAllowed: '2',
        groupTag: '',
      }),
    ).resolves.toEqual({ ok: false, error: 'seats', people: 4 });
  });

  it('answers "not found" for a guest of another event', async () => {
    const champanhe = await prisma.guest.findFirstOrThrow({
      where: { event: { slug: 'braulio-e-nanda-champanhe' } },
    });
    as(cookies.couple);
    await expect(
      editGuest(eventId, champanhe.id, {
        displayName: 'Trocado',
        phone: '',
        seatsAllowed: '1',
        groupTag: '',
      }),
    ).resolves.toEqual({ ok: false, error: 'not-found' });
    await expect(removeGuest(eventId, champanhe.id)).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
  });
});

describe('answers recorded by the couple', () => {
  it('records a WhatsApp confirmation, keeping the tap', async () => {
    const carlos = await guestNamed('Carlos Mendes');
    as(cookies.couple);
    const result = await saveGuestAnswer(eventId, carlos.id, {
      attending: 'sim',
      peopleCount: '1',
    });
    expect(result).toMatchObject({
      ok: true,
      guest: { rsvp: { attending: true, peopleCount: 1, source: 'COUPLE' } },
    });
    const saved = await guestNamed('Carlos Mendes');
    expect(saved.rsvp?.whatsappIntentAt).toEqual(carlos.rsvp?.whatsappIntentAt);
  });

  it('drops companions beyond a lower count, and clears an answer', async () => {
    const ana = await guestNamed('Ana e Pedro');
    as(cookies.couple);
    await saveGuestAnswer(eventId, ana.id, { attending: 'sim', peopleCount: '1' });
    expect((await guestNamed('Ana e Pedro')).rsvp).toMatchObject({
      attending: true,
      peopleCount: 1,
      companionNames: [],
    });
    await saveGuestAnswer(eventId, ana.id, { attending: '', peopleCount: '1' });
    expect((await guestNamed('Ana e Pedro')).rsvp).toMatchObject({
      attending: null,
      peopleCount: null,
    });
  });

  it('refuses more people than seats', async () => {
    const joao = await guestNamed('João Manuel');
    as(cookies.couple);
    await expect(
      saveGuestAnswer(eventId, joao.id, { attending: 'sim', peopleCount: '2' }),
    ).resolves.toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'peopleCount' }] });
    expect((await guestNamed('João Manuel')).rsvp).toBeNull();
  });
});

describe('personal links', () => {
  it('marks a link as sent, and back', async () => {
    const domingos = await guestNamed('Família Domingos');
    as(cookies.couple);
    const sent = await markGuestSent(eventId, domingos.id, true);
    expect(sent).toMatchObject({ ok: true, guest: { sentAt: expect.any(String) } });
    const undone = await markGuestSent(eventId, domingos.id, false);
    expect(undone).toMatchObject({ ok: true, guest: { sentAt: null } });
    await expect(markGuestSent(eventId, domingos.id, 'sim')).resolves.toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('renews a link: the old one stops working at once', async () => {
    const madalena = await guestNamed('Madalena Costa');
    expect(await getInvitation(DEMO_EVENT.slug, madalena.token)).not.toBeNull();

    as(cookies.couple);
    const result = await renewGuestLink(eventId, madalena.id);
    expect(result).toMatchObject({ ok: true, guest: { sentAt: null } });
    if (!result.ok) return;
    expect(tokenOf(result.guest)).not.toBe(madalena.token);
    expect(await getInvitation(DEMO_EVENT.slug, madalena.token)).toBeNull();
    expect((await getInvitation(DEMO_EVENT.slug, tokenOf(result.guest)))?.guest.id).toBe(
      madalena.id,
    );
  });

  it('deletes a guest with their answer and views', async () => {
    const luisa = await guestNamed('Dra. Luísa Ferreira');
    expect(await getInvitation(DEMO_EVENT.slug, luisa.token)).not.toBeNull();
    as(cookies.couple);
    await expect(removeGuest(eventId, luisa.id)).resolves.toEqual({ ok: true });
    expect(await getInvitation(DEMO_EVENT.slug, luisa.token)).toBeNull();
    expect(await prisma.rsvp.count({ where: { guestId: luisa.id } })).toBe(0);
    expect(await prisma.invitationView.count({ where: { guestId: luisa.id } })).toBe(0);
    await expect(removeGuest(eventId, luisa.id)).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
  });
});

describe('the message sent with each link', () => {
  const stored = async () =>
    (await prisma.event.findUniqueOrThrow({ where: { id: eventId } })).inviteMessage;

  it('keeps the couple’s text, and goes back to the suggested one', async () => {
    as(cookies.couple);
    await expect(updateInviteMessage(eventId, 'Olá {convidado}! {link}')).resolves.toEqual({
      ok: true,
      template: 'Olá {convidado}! {link}',
    });
    expect(await stored()).toBe('Olá {convidado}! {link}');
    await expect(updateInviteMessage(eventId, '  ')).resolves.toEqual({ ok: true, template: null });
    expect(await stored()).toBeNull();
  });

  it('refuses long texts and other couples', async () => {
    as(cookies.couple);
    await expect(updateInviteMessage(eventId, 'x'.repeat(1001))).resolves.toMatchObject({
      ok: false,
      error: 'invalid',
    });
    as(cookies.other);
    await expect(updateInviteMessage(eventId, 'Olá')).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
  });
});

describe('the list after the changes', () => {
  it('lists every guest of the event only', async () => {
    const list = await listGuests({ id: eventId, slug: DEMO_EVENT.slug });
    expect(list.map((guest) => guest.displayName)).not.toContain('Dra. Luísa Ferreira');
    expect(list.map((guest) => guest.displayName)).toContain('Família Nova');
    expect(new Set(list.map((guest) => guest.link)).size).toBe(list.length);
  });
});
