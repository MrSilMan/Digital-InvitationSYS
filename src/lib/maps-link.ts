/**
 * Google Maps links pasted by couples → coordinates for the Waze button. Handles the usual shapes:
 *
 * - place pages: …/maps/place/Praia+do+Bispo/@-8.82,13.22,17z/data=!3d-8.8290!4d13.2250 (the
 *   `!3d…!4d…` pair is the pin; `@lat,lng` only the map's centre)
 * - searches and directions: ?q=-8.829,13.225, ?query=…, ?ll=…, ?destination=…, /search/-8.829,13.225
 * - short share links (maps.app.goo.gl/…) carry no coordinates: the server follows them
 *   (src/server/maps/resolve-short-link.ts).
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const NUMBER = String.raw`[-+]?\d{1,3}(?:\.\d+)?`;
const PIN = new RegExp(String.raw`!3d(${NUMBER})!4d(${NUMBER})`);
const PAIR = new RegExp(String.raw`^\s*(${NUMBER})\s*,\s*(${NUMBER})\s*$`);
const PATH_PAIR = new RegExp(
  String.raw`/(?:search|place|dir)/(?:[^/]*/)*?(${NUMBER}),\s*(${NUMBER})(?:[/?]|$)`,
);
const CENTRE = new RegExp(String.raw`@(${NUMBER}),(${NUMBER})`);
const QUERY_KEYS = ['q', 'query', 'll', 'center', 'destination', 'daddr', 'sll'];

const GOOGLE_HOST = /^(?:www\.|maps\.)?google\.(?:com|[a-z]{2,3}|com?\.[a-z]{2})$/;
const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

function toCoordinates(lat: string | undefined, lng: string | undefined): Coordinates | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

function parseUrl(link: string): URL | null {
  try {
    const url = new URL(link.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** A Google Maps page (long form, with or without coordinates). */
export function isGoogleMapsUrl(link: string): boolean {
  const url = parseUrl(link);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  if (SHORT_HOSTS.has(host)) return host === 'maps.app.goo.gl' || url.pathname.startsWith('/maps');
  return GOOGLE_HOST.test(host) && (host.startsWith('maps.') || url.pathname.startsWith('/maps'));
}

/** A short share link that has to be followed to find the coordinates. */
export function isShortMapsUrl(link: string): boolean {
  const url = parseUrl(link);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'));
}

/** Coordinates found in a Google Maps link, or null. */
export function parseMapsCoordinates(link: string): Coordinates | null {
  const url = parseUrl(link);
  if (!url) return null;
  const decoded = decodeURIComponent(url.href);

  const pin = PIN.exec(decoded);
  if (pin) return toCoordinates(pin[1], pin[2]);

  for (const key of QUERY_KEYS) {
    const pair = PAIR.exec(url.searchParams.get(key) ?? '');
    if (pair) return toCoordinates(pair[1], pair[2]);
  }

  const pathPair = PATH_PAIR.exec(decodeURIComponent(url.pathname));
  if (pathPair) return toCoordinates(pathPair[1], pathPair[2]);

  const centre = CENTRE.exec(decoded);
  if (centre) return toCoordinates(centre[1], centre[2]);

  // Consent pages (servers in Europe) wrap the real link in `continue`.
  const next = url.searchParams.get('continue');
  return next && next !== link ? parseMapsCoordinates(next) : null;
}
