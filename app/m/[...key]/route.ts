import { logger } from '@/lib/logger';
import { SERVED_PREFIX, servedPath } from '@/lib/media/keys';
import { getObjectStream, headObject } from '@/server/storage/s3';

/**
 * Processed media from the private bucket: `/m/<event>/<media>/w960.webp` serves
 * `media/<event>/<media>/w960.webp`. Only the worker's output (`media/`) is reachable, never an
 * original. A key never gets other content, so browsers cache files for a year; byte ranges
 * let music play and seek on iPhones. Anything else answers the same "not found".
 */

const CONTENT_TYPES: Record<string, string> = { webp: 'image/webp', mp3: 'audio/mpeg' };
/** One range: "bytes=0-", "bytes=100-199" or the last N bytes ("bytes=-500"). */
const SINGLE_RANGE = /^bytes=(?:\d+-\d*|-\d+)$/;

function notFound(): Response {
  return new Response('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request, context: RouteContext<'/m/[...key]'>) {
  const { key: segments } = await context.params;
  const key = `${SERVED_PREFIX}${segments.join('/')}`;
  const extension = key.slice(key.lastIndexOf('.') + 1);
  const contentType = CONTENT_TYPES[extension];
  if (!servedPath(key) || !contentType) return notFound();

  // Other range forms (several ranges) are allowed to be ignored: the whole file is sent.
  const rangeHeader = request.headers.get('range')?.trim();
  const range = rangeHeader && SINGLE_RANGE.test(rangeHeader) ? rangeHeader : undefined;

  let object: Awaited<ReturnType<typeof getObjectStream>>;
  try {
    object = await getObjectStream(key, range);
  } catch (err) {
    logger.error('Could not read media from storage', { err, key });
    return new Response('Unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  if (object === null) return notFound();
  if (object === 'invalid-range') {
    const head = await headObject(key).catch(() => null);
    return new Response(null, {
      status: 416,
      headers: head ? { 'Content-Range': `bytes */${head.size}` } : {},
    });
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    // Opened on its own, the file is a sandboxed document that can run nothing.
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });
  if (object.contentLength !== undefined) {
    headers.set('Content-Length', String(object.contentLength));
  }
  if (object.etag) headers.set('ETag', object.etag);
  if (object.partial && object.contentRange) headers.set('Content-Range', object.contentRange);
  return new Response(object.body, { status: object.partial ? 206 : 200, headers });
}
