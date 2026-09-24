import 'server-only';

import { type Coordinates, isShortMapsUrl, parseMapsCoordinates } from '@/lib/maps-link';

/**
 * Follows a Google Maps share link (maps.app.goo.gl/…) to the page it points to and reads the
 * coordinates there. Redirects are followed one by one and only to Google hosts over https, so a
 * pasted link can never make the server fetch anything else (no SSRF). A few seconds at most.
 */

const ALLOWED_HOST =
  /^(?:maps\.app\.goo\.gl|goo\.gl|(?:www\.|maps\.|consent\.)?google\.(?:com|[a-z]{2,3}|com?\.[a-z]{2}))$/;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 4_000;

export type ResolveShortLinkResult =
  { ok: true; coordinates: Coordinates | null } | { ok: false; error: 'invalid' | 'unavailable' };

export async function resolveShortMapsLink(
  link: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolveShortLinkResult> {
  if (!isShortMapsUrl(link)) return { ok: false, error: 'invalid' };
  let current = new URL(link);

  for (let redirects = 0; ; redirects += 1) {
    const coordinates = parseMapsCoordinates(current.href);
    if (coordinates || redirects === MAX_REDIRECTS) return { ok: true, coordinates };

    let response: Response;
    try {
      response = await fetchImpl(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'accept-language': 'pt-PT,pt;q=0.9' },
      });
      await response.body?.cancel();
    } catch {
      return { ok: false, error: 'unavailable' };
    }

    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) {
      return { ok: true, coordinates: null };
    }
    const next = new URL(location, current);
    if (next.protocol !== 'https:' || !ALLOWED_HOST.test(next.hostname)) {
      return { ok: true, coordinates: parseMapsCoordinates(next.href) };
    }
    current = next;
  }
}
