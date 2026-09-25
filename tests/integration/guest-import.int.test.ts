import Papa from 'papaparse';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { getGuestImport, startGuestImport } from '@/features/dashboard/guests/import-actions';
import { getPrisma } from '@/server/db/prisma';
import { runGuestImport, sweepGuestImports } from '@/server/guests/import';
import * as guestQueue from '@/server/queues/guest-queue';

import { GET as downloadErrors } from '../../app/(dashboard)/painel/eventos/[eventId]/convidados/importacoes/[importId]/erros/route';
import { GET as downloadTemplate } from '../../app/(dashboard)/painel/modelo-convidados.csv/route';
import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_USERS } from '../../prisma/seed/demo-data';

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
const cookies = { couple: '', other: '' };

function as(cookie: string | null) {
  requestHeaders = new Headers({
    'x-forwarded-for': '203.0.113.90',
    ...(cookie ? { cookie } : {}),
  });
}

function csvFile(
  content: string | Uint8Array<ArrayBuffer>,
  name = 'convidados.csv',
  type = 'text/csv',
) {
  const data = new FormData();
  data.set('ficheiro', new File([content], name, { type }));
  return data;
}

const FILE = [
  'nome;telefone;lugares;grupo',
  'Família Importada;923 111 222;3;amigos', // new; group spelled like the existing "Amigos"
  'Família Silva;+244 900 000 101;4;Família da noiva', // already on the list (seed)
  ';123;0;', // invalid
  'Tia Importada;;;', // new, one seat
  'tia  importada;;;', // the same guest again in the file
].join('\r\n');

const guestCount = () => prisma.guest.count({ where: { eventId } });

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  eventId = (await seedDemo(prisma, passwords)).eventId;
  await connectAppRedis();
  await createCouple(prisma, other);
  cookies.couple = await sessionCookie(DEMO_USERS.couple.email, passwords.couplePassword);
  cookies.other = await sessionCookie(other.email, other.password);
});

afterAll(async () => {
  await guestQueue.getGuestQueue().close();
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

describe('importing a CSV file', () => {
  let importId = '';

  it('stores the file and queues it for the worker', async () => {
    as(cookies.couple);
    const result = await startGuestImport(eventId, csvFile(FILE));
    expect(result).toMatchObject({
      ok: true,
      import: { status: 'PENDING', fileName: 'convidados.csv' },
    });
    if (!result.ok) return;
    importId = result.import.id;
    const job = await guestQueue.getGuestQueue().getJob(guestQueue.importJobId(importId));
    expect(job?.data).toEqual({ importId });
  });

  it('adds the valid new guests and reports the rest (the worker’s job)', async () => {
    const before = await guestCount();
    await expect(runGuestImport(importId)).resolves.toEqual({
      status: 'DONE',
      imported: 2,
      duplicates: 2,
      invalid: 1,
    });
    expect(await guestCount()).toBe(before + 2);
    const added = await prisma.guest.findMany({
      where: { eventId, displayName: { in: ['Família Importada', 'Tia Importada'] } },
      orderBy: { displayName: 'asc' },
    });
    expect(
      added.map(({ displayName, phone, seatsAllowed, groupTag }) => [
        displayName,
        phone,
        seatsAllowed,
        groupTag,
      ]),
    ).toEqual([
      ['Família Importada', '+244923111222', 3, 'Amigos'],
      ['Tia Importada', null, 1, null],
    ]);
    expect(added.every((guest) => /^[\w-]{22}$/.test(guest.token))).toBe(true);

    const stored = await prisma.guestImport.findUniqueOrThrow({ where: { id: importId } });
    expect(stored).toMatchObject({ status: 'DONE', content: null, totalRows: 5 });

    as(cookies.couple);
    const view = await getGuestImport(eventId, importId);
    expect(view).toMatchObject({
      ok: true,
      import: {
        status: 'DONE',
        totalRows: 5,
        imported: 2,
        duplicates: 2,
        invalid: 1,
        failure: null,
      },
    });
    if (!view.ok) return;
    expect(view.import.problems.map((problem) => [problem.row, problem.kind])).toEqual([
      [3, 'duplicate'],
      [4, 'invalid'],
      [6, 'duplicate'],
    ]);
  });

  it('adds nothing twice when the job runs again', async () => {
    const before = await guestCount();
    await expect(runGuestImport(importId)).resolves.toEqual({ status: 'skipped' });
    expect(await guestCount()).toBe(before);
  });

  it('offers the rows with errors to fix and import again', async () => {
    as(cookies.couple);
    const response = await downloadErrors(new Request('http://localhost:3000/'), {
      params: Promise.resolve({ eventId, importId }),
    });
    expect(response.status).toBe(200);
    const text = new TextDecoder().decode(await response.arrayBuffer());
    const rows = Papa.parse<string[]>(text, { delimiter: ';', skipEmptyLines: true }).data;
    expect(rows).toHaveLength(2);
    expect(rows[1]?.slice(0, 5)).toEqual(['', '123', '0', '', '4']);

    as(cookies.other);
    const refused = await downloadErrors(new Request('http://localhost:3000/'), {
      params: Promise.resolve({ eventId, importId }),
    });
    expect(refused.status).toBe(404);
    await expect(getGuestImport(eventId, importId)).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
  });

  it('skips everyone when the same file comes again', async () => {
    const spy = vi.spyOn(guestQueue, 'enqueueGuestImport').mockResolvedValue(false);
    const before = await guestCount();
    as(cookies.couple);
    // Redis "down": the action imports at once.
    const result = await startGuestImport(eventId, csvFile(FILE));
    expect(spy).toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      import: { status: 'DONE', imported: 0, duplicates: 4, invalid: 1 },
    });
    expect(await guestCount()).toBe(before);
  });

  it('imports nothing when the new guests do not fit in the plan', async () => {
    vi.spyOn(guestQueue, 'enqueueGuestImport').mockResolvedValue(false);
    const before = await guestCount();
    await prisma.event.update({ where: { id: eventId }, data: { guestLimit: before + 1 } });
    try {
      as(cookies.couple);
      const result = await startGuestImport(
        eventId,
        csvFile('nome\nPrimo Um\nPrimo Dois\nPrimo Três'),
      );
      expect(result).toMatchObject({
        ok: true,
        import: { status: 'FAILED', failure: 'limit', wanted: 3, room: 1, imported: 0 },
      });
      expect(await guestCount()).toBe(before);
    } finally {
      await prisma.event.update({ where: { id: eventId }, data: { guestLimit: 150 } });
    }
  });

  it('reads files saved by Excel as Windows-1252', async () => {
    vi.spyOn(guestQueue, 'enqueueGuestImport').mockResolvedValue(false);
    // "nome\r\nFamília Gonçalves" with í = 0xED and ç = 0xE7.
    const bytes = Uint8Array.from([
      ...new TextEncoder().encode('nome\r\nFam'),
      0xed,
      ...new TextEncoder().encode('lia Gon'),
      0xe7,
      ...new TextEncoder().encode('alves'),
    ]);
    as(cookies.couple);
    const result = await startGuestImport(
      eventId,
      csvFile(bytes, 'excel.csv', 'application/vnd.ms-excel'),
    );
    expect(result).toMatchObject({ ok: true, import: { status: 'DONE', imported: 1 } });
    expect(await prisma.guest.count({ where: { eventId, displayName: 'Família Gonçalves' } })).toBe(
      1,
    );
  });

  it('reports files it cannot read', async () => {
    vi.spyOn(guestQueue, 'enqueueGuestImport').mockResolvedValue(false);
    as(cookies.couple);
    await expect(
      startGuestImport(eventId, csvFile('Família Silva;923456789')),
    ).resolves.toMatchObject({
      ok: true,
      import: { status: 'FAILED', failure: 'no-name-column' },
    });
  });

  it('keeps only the event’s last five imports', async () => {
    expect(await prisma.guestImport.count({ where: { eventId } })).toBe(5);
    vi.spyOn(guestQueue, 'enqueueGuestImport').mockResolvedValue(false);
    as(cookies.couple);
    await startGuestImport(eventId, csvFile('nome\nMais Um'));
    expect(await prisma.guestImport.count({ where: { eventId } })).toBe(5);
    expect(await prisma.guestImport.count({ where: { id: importId } })).toBe(0);
  });
});

describe('refusals', () => {
  it('checks the session, the owner and the file before storing anything', async () => {
    const before = await prisma.guestImport.count();
    as(cookies.other);
    await expect(startGuestImport(eventId, csvFile(FILE))).resolves.toEqual({
      ok: false,
      error: 'not-found',
    });
    as(null);
    await expect(startGuestImport(eventId, csvFile(FILE))).resolves.toEqual({
      ok: false,
      error: 'unauthenticated',
    });

    as(cookies.couple);
    await expect(startGuestImport(eventId, new FormData())).resolves.toEqual({
      ok: false,
      error: 'invalid',
    });
    await expect(
      startGuestImport(eventId, csvFile('x', 'convidados.xlsx', 'application/vnd.openxmlformats')),
    ).resolves.toEqual({ ok: false, error: 'type' });
    await expect(startGuestImport(eventId, csvFile(''))).resolves.toEqual({
      ok: false,
      error: 'empty',
    });
    await expect(
      startGuestImport(eventId, csvFile(`nome\n${'x'.repeat(600 * 1024)}`)),
    ).resolves.toEqual({ ok: false, error: 'size' });
    expect(await prisma.guestImport.count()).toBe(before);
  });
});

describe('template and sweep', () => {
  it('offers the template to signed-in users', async () => {
    as(cookies.couple);
    const response = await downloadTemplate(new Request('http://localhost:3000/'));
    expect(response.status).toBe(200);
    expect(new TextDecoder().decode(await response.arrayBuffer())).toMatch(
      /^nome;telefone;lugares;grupo\r\nFamília Silva;900 000 101;4;Família da noiva\r\n/,
    );
    as(null);
    expect((await downloadTemplate(new Request('http://localhost:3000/'))).status).toBe(303);
  });

  it('queues forgotten imports again and gives up abandoned ones', async () => {
    const now = new Date();
    const make = (minutesAgo: number) =>
      prisma.guestImport.create({
        data: {
          eventId,
          fileName: `${minutesAgo}.csv`,
          content: 'nome\nNinguém',
          createdAt: new Date(now.getTime() - minutesAgo * 60_000),
        },
      });
    const fresh = await make(0);
    const forgotten = await make(10);
    const abandoned = await make(2 * 24 * 60);

    const requeued: string[] = [];
    const result = await sweepGuestImports({
      now,
      requeue: async (id) => {
        requeued.push(id);
      },
    });
    expect(result).toEqual({ requeued: 1, abandoned: 1 });
    expect(requeued).toEqual([forgotten.id]);
    expect(
      await prisma.guestImport.findUniqueOrThrow({ where: { id: abandoned.id } }),
    ).toMatchObject({
      status: 'FAILED',
      failure: 'error',
      content: null,
    });
    expect((await prisma.guestImport.findUniqueOrThrow({ where: { id: fresh.id } })).status).toBe(
      'PENDING',
    );
  });
});
