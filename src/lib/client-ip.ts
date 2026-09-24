import { isIP } from 'node:net';

/**
 * The visitor's IP address, for rate limiting.
 *
 * In production Caddy sets `X-Forwarded-For` to the client's address (it ignores client-sent
 * values unless configured to trust them); without a proxy, Next.js fills it with the socket's
 * address when absent. The right-most entry is the one added by the closest proxy, so it is the
 * hardest to spoof. "unknown" when nothing usable is there (all such requests share one bucket).
 */
export function clientIp(headers: Pick<Headers, 'get'>): string {
  const forwarded = headers.get('x-forwarded-for');
  const candidates = [
    ...(forwarded ? forwarded.split(',').reverse() : []),
    headers.get('x-real-ip') ?? '',
  ].map((value) => value.trim().replace(/^::ffff:/, ''));
  return candidates.find((value) => isIP(value) !== 0) ?? 'unknown';
}
