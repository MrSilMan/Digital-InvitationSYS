import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { GET as serveMedia } from '../../app/m/[...key]/route';
import {
  confirmUpload,
  listMedia,
  removeMedia,
  reorderMedia,
  requestUpload,
  retryProcessing,
  saveAltText,
} from '@/features/dashboard/media/actions';
import type { MediaType } from '@/lib/media/rules';
import { createGuestToken } from '@/lib/guest-token';
import { getAuth } from '@/server/auth/auth';
import { getPrisma } from '@/server/db/prisma';
import { getInvitation } from '@/server/invitations/queries';
import { deleteStoredFiles } from '@/server/media/files';
import { processMedia, sweepMedia } from '@/server/media/processing';
import { taggedMp3 } from '@/server/media/test-files';
import { imageFiles } from '@/server/media/variants';
import { getMediaQueue, processJobId } from '@/server/queues/media-queue';
import { headObject } from '@/server/storage/s3';

import { seedDemo } from '../../prisma/seed/demo';
import { DEMO_USERS } from '../../prisma/seed/demo-data';

import { createTestPrisma, wipeDatabase } from './db';
import { closeAppRedis, connectAppRedis, flushTestRedis } from './redis';
import { deleteEventFiles, ensureTestBucket } from './storage';

// Server Actions read the session cookie through next/headers.
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
const event = { id: '', slug: 'teste-multimedia', guestToken: createGuestToken() };
const cookies = { couple: '', admin: '' };

async function sessionCookie(email: string, password: string): Promise<string> {
  const response = await getAuth().api.signInEmail({ body: { email, password }, asResponse: true });
  const cookie = /convites\.session_token=[^;]+/.exec(
    response.headers.get('set-cookie') ?? '',
  )?.[0];
  if (!cookie) throw new Error(`No session cookie for ${email}`);
  return cookie;
}

function as(cookie: string | null) {
  requestHeaders = new Headers({
    'x-forwarded-for': '203.0.113.80',
    ...(cookie ? { cookie } : {}),
  });
}

async function photo(width: number, height: number, color = '#b07050'): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
}

/** Upload steps as the dashboard runs them: upload URL, PUT to storage, confirmation. */
async function upload(type: MediaType, body: Buffer, mimeType: string): Promise<string> {
  const requested = await requestUpload(event.id, { type, mimeType, size: body.length });
  if (!requested.ok) throw new Error(`Upload refused: ${requested.error}`);
  const stored = await fetch(requested.upload.url, {
    method: 'PUT',
    headers: requested.upload.headers,
    body: new Uint8Array(body),
  });
  expect(stored.status).toBe(200);
  const confirmed = await confirmUpload(event.id, requested.media.id);
  if (!confirmed.ok) throw new Error(`Confirmation refused: ${confirmed.error}`);
  return requested.media.id;
}

async function media(id: string) {
  return prisma.media.findUnique({ where: { id } });
}

/** Runs the queued `delete-files` jobs the way the worker does. */
async function runFileDeletions(): Promise<void> {
  const jobs = await getMediaQueue().getJobs(['waiting', 'delayed', 'prioritized']);
  for (const job of jobs.filter((candidate) => candidate.name === 'delete-files')) {
    await deleteStoredFiles(job.data as { keys: string[]; prefixes: string[] });
    await job.remove();
  }
}

function serve(key: string, headers: Record<string, string> = {}) {
  const segments = key.replace(/^media\//, '').split('/');
  return serveMedia(new Request(`http://localhost/m/${segments.join('/')}`, { headers }), {
    params: Promise.resolve({ key: segments }),
  });
}

beforeAll(async () => {
  await wipeDatabase(prisma);
  await flushTestRedis();
  await ensureTestBucket();
  await seedDemo(prisma, passwords);
  await connectAppRedis();

  const couple = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USERS.couple.email },
  });
  const created = await prisma.event.create({
    data: {
      ownerId: couple.id,
      slug: event.slug,
      phase: 'INVITATION',
      groomName: 'Teste',
      brideName: 'Multimédia',
      startsAt: new Date('2027-06-12T14:00:00Z'),
      guests: { create: { token: event.guestToken, displayName: 'Família Teste' } },
    },
  });
  event.id = created.id;

  cookies.couple = await sessionCookie(DEMO_USERS.couple.email, passwords.couplePassword);
  cookies.admin = await sessionCookie(DEMO_USERS.admin.email, passwords.adminPassword);
});

afterAll(async () => {
  if (event.id) await deleteEventFiles(event.id);
  await getMediaQueue().close();
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('convites.mediaQueue')];
  await prisma.$disconnect();
  await getPrisma().$disconnect();
  await closeAppRedis();
});

describe('photo upload', () => {
  let photoId: string;

  it('goes from the browser to storage, through the worker, to the guest page', async () => {
    as(cookies.couple);
    photoId = await upload('GALLERY', await photo(1200, 900), 'image/jpeg');
    expect((await media(photoId))?.status).toBe('PENDING');
    expect(await getMediaQueue().getJob(processJobId(photoId))).toBeDefined();

    expect(await processMedia(photoId)).toBe('ready');
    const row = await media(photoId);
    expect(row).toMatchObject({ status: 'READY', width: 1200, height: 900, error: null });
    const files = imageFiles(row?.variants);
    expect(files.map((file) => file.width)).toEqual([480, 960, 1200]);
    for (const file of files) expect(await headObject(file.key)).not.toBeNull();

    const invitation = await getInvitation(event.slug, event.guestToken);
    expect(invitation?.event.gallery).toEqual([
      {
        src: `/m/${event.id}/${photoId}/w1200.webp`,
        width: 1200,
        height: 900,
        alt: null,
        widths: [480, 960, 1200],
      },
    ]);
  });

  it('is served by /m/… with long caching and byte ranges, never the original', async () => {
    const row = await media(photoId);
    const small = imageFiles(row?.variants)[0];
    if (!small || !row) throw new Error('No processed file');

    const whole = await serve(small.key);
    expect(whole.status).toBe(200);
    expect(whole.headers.get('content-type')).toBe('image/webp');
    expect(whole.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(whole.headers.get('x-content-type-options')).toBe('nosniff');
    const body = Buffer.from(await whole.arrayBuffer());
    expect((await sharp(body).metadata()).width).toBe(480);

    const part = await serve(small.key, { range: 'bytes=0-9' });
    expect(part.status).toBe(206);
    expect(part.headers.get('content-range')).toBe(`bytes 0-9/${body.length}`);
    expect((await part.arrayBuffer()).byteLength).toBe(10);

    expect((await serve(small.key, { range: `bytes=${body.length + 10}-` })).status).toBe(416);
    for (const key of [
      row.originalKey,
      `media/../${row.originalKey}`,
      `media/${event.id}/${photoId}/w123.webp`,
      `media/${event.id}/${photoId}/w480.jpg`,
    ]) {
      expect((await serve(key)).status).toBe(404);
    }
  });

  it('keeps the description, the order and the list up to date', async () => {
    as(cookies.couple);
    const second = await upload('GALLERY', await photo(800, 800, '#304050'), 'image/jpeg');
    await processMedia(second);

    expect(await saveAltText(event.id, photoId, '  Os noivos na praia  ')).toEqual({ ok: true });
    const moved = await reorderMedia(event.id, second, -1);
    expect(moved.ok && moved.items.map((item) => item.id)).toEqual([second, photoId]);

    const invitation = await getInvitation(event.slug, event.guestToken);
    expect(invitation?.event.gallery.map((image) => image.alt)).toEqual([
      null,
      'Os noivos na praia',
    ]);
    const listed = await listMedia(event.id);
    expect(listed.ok && listed.items.map((item) => item.status)).toEqual(['READY', 'READY']);
  });

  it('refuses a file that is not what it claims, for good', async () => {
    as(cookies.couple);
    const fake = await upload('GALLERY', Buffer.from('definitely not a photo'), 'image/jpeg');
    expect(await processMedia(fake)).toBe('rejected');
    expect(await media(fake)).toMatchObject({ status: 'FAILED', error: 'unreadable' });

    const retried = await retryProcessing(event.id, fake);
    expect(retried.ok && retried.media.status).toBe('FAILED');
    expect((await removeMedia(event.id, fake)).ok).toBe(true);
  });

  it('marks an upload that never reached storage', async () => {
    as(cookies.couple);
    const requested = await requestUpload(event.id, {
      type: 'GALLERY',
      mimeType: 'image/png',
      size: 1234,
    });
    if (!requested.ok) throw new Error(requested.error);
    const confirmed = await confirmUpload(event.id, requested.media.id);
    expect(confirmed.ok && confirmed.media).toMatchObject({
      status: 'FAILED',
      failure: 'missing',
    });
    await removeMedia(event.id, requested.media.id);
  });
});

describe('upload URLs', () => {
  it('only accept the declared type and size', async () => {
    as(cookies.couple);
    const body = await photo(100, 100);
    const requested = await requestUpload(event.id, {
      type: 'GALLERY',
      mimeType: 'image/jpeg',
      size: body.length,
    });
    if (!requested.ok) throw new Error(requested.error);
    const { url } = requested.upload;
    const put = (headers: Record<string, string>, data: Uint8Array<ArrayBuffer>) =>
      fetch(url, { method: 'PUT', headers, body: data });

    expect((await put({ 'Content-Type': 'text/html' }, new Uint8Array(body))).status).toBe(403);
    expect(
      (await put({ 'Content-Type': 'image/jpeg' }, new Uint8Array(body.length + 1))).status,
    ).toBe(403);
    await removeMedia(event.id, requested.media.id);
  });

  it('refuse wrong files, other people and full galleries', async () => {
    as(cookies.couple);
    const ask = (input: unknown) => requestUpload(event.id, input);
    expect(await ask({ type: 'GALLERY', mimeType: 'image/heic', size: 10 })).toEqual({
      ok: false,
      error: 'type',
    });
    expect(await ask({ type: 'MUSIC', mimeType: 'audio/mpeg', size: 6 * 1024 * 1024 })).toEqual({
      ok: false,
      error: 'size',
    });
    expect(await ask({ type: 'VIDEO', mimeType: 'video/mp4', size: 10 })).toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(await removeMedia(event.id, 'not-a-uuid')).toEqual({ ok: false, error: 'invalid' });

    as(null);
    expect((await listMedia(event.id)).ok).toBe(false);
    as(cookies.admin);
    expect((await listMedia(event.id)).ok).toBe(true);

    // Two photos are in the gallery already: ten more fit, the eleventh does not.
    as(cookies.couple);
    const pending: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const result = await ask({ type: 'GALLERY', mimeType: 'image/jpeg', size: 1000 });
      if (!result.ok) throw new Error(result.error);
      pending.push(result.media.id);
    }
    expect(await ask({ type: 'GALLERY', mimeType: 'image/jpeg', size: 1000 })).toEqual({
      ok: false,
      error: 'limit',
    });
    for (const id of pending) await removeMedia(event.id, id);
  });

  it('refuse another couple’s event as if it did not exist', async () => {
    const otherEvent = await prisma.event.findFirstOrThrow({ where: { slug: 'braulio-e-nanda' } });
    await prisma.event.update({
      where: { id: otherEvent.id },
      data: { ownerId: (await prisma.user.findFirstOrThrow({ where: { role: 'admin' } })).id },
    });
    as(cookies.couple);
    expect(
      await requestUpload(otherEvent.id, { type: 'HERO', mimeType: 'image/png', size: 10 }),
    ).toEqual({ ok: false, error: 'not-found' });
  });
});

describe('hero, logo and music', () => {
  it('replaces the previous hero once the new one is ready, and deletes its files', async () => {
    as(cookies.couple);
    const first = await upload('HERO', await photo(1400, 700), 'image/jpeg');
    await processMedia(first);
    const firstFiles = imageFiles((await media(first))?.variants);
    expect(firstFiles.map((file) => file.width)).toEqual([540, 1080]);

    const second = await upload('HERO', await photo(600, 300, '#203040'), 'image/jpeg');
    // Until the new one is ready, guests keep the current hero.
    const before = await getInvitation(event.slug, event.guestToken);
    expect(before?.event.hero?.src).toBe(`/m/${event.id}/${first}/w1080.webp`);

    await processMedia(second);
    expect(await media(first)).toBeNull();
    const after = await getInvitation(event.slug, event.guestToken);
    expect(after?.event.hero).toMatchObject({ src: `/m/${event.id}/${second}/w600.webp` });

    await runFileDeletions();
    for (const file of firstFiles) expect(await headObject(file.key)).toBeNull();
  });

  it('keeps only the audio of an MP3, without its tags', async () => {
    as(cookies.couple);
    const song = await upload('MUSIC', taggedMp3(30), 'audio/mpeg');
    expect(await processMedia(song)).toBe('ready');

    const invitation = await getInvitation(event.slug, event.guestToken);
    expect(invitation?.event.music).toEqual({
      src: `/m/${event.id}/${song}/musica.mp3`,
      mimeType: 'audio/mpeg',
    });
    const response = await serve(`media/${event.id}/${song}/musica.mp3`);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xfb]);
    expect(bytes.length).toBe(30 * 417);
  });

  it('refuses music that is not an MP3', async () => {
    as(cookies.couple);
    const wav = await upload(
      'MUSIC',
      Buffer.from('RIFF....WAVEfmt definitely not mp3'),
      'audio/mpeg',
    );
    expect(await processMedia(wav)).toBe('rejected');
    expect(await media(wav)).toMatchObject({ status: 'FAILED', error: 'not-mp3' });
    // The song in use stays.
    const invitation = await getInvitation(event.slug, event.guestToken);
    expect(invitation?.event.music?.src).toMatch(/musica\.mp3$/);
  });
});

describe('deletion and the sweep', () => {
  it('deletes a photo and its files', async () => {
    as(cookies.couple);
    const id = await upload('GALLERY', await photo(500, 500), 'image/jpeg');
    await processMedia(id);
    const files = imageFiles((await media(id))?.variants);

    expect(await removeMedia(event.id, id)).toEqual({ ok: true });
    expect(await media(id)).toBeNull();
    await runFileDeletions();
    for (const file of files) expect(await headObject(file.key)).toBeNull();
    expect(await processMedia(id)).toBe('gone');
  });

  it('queues forgotten uploads again and removes abandoned ones', async () => {
    as(cookies.couple);
    const body = await photo(300, 300);
    const arrived = await requestUpload(event.id, {
      type: 'GALLERY',
      mimeType: 'image/jpeg',
      size: body.length,
    });
    const abandoned = await requestUpload(event.id, {
      type: 'GALLERY',
      mimeType: 'image/jpeg',
      size: 999,
    });
    if (!arrived.ok || !abandoned.ok) throw new Error('Upload refused');
    // Uploaded, but the browser never confirmed it (closed tab, Redis down…).
    await fetch(arrived.upload.url, {
      method: 'PUT',
      headers: arrived.upload.headers,
      body: new Uint8Array(body),
    });

    const requeued: string[] = [];
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await sweepMedia({
      now: inTwoHours,
      requeue: async (id) => {
        requeued.push(id);
      },
    });
    expect(requeued).toContain(arrived.media.id);
    expect(requeued).not.toContain(abandoned.media.id);
    expect(await media(abandoned.media.id)).toBeNull();
    expect((await media(arrived.media.id))?.status).toBe('PENDING');
  });
});
