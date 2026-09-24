/**
 * Public URLs of stored media.
 *
 * - `demo/…` keys: files shipped in /public/demo for the demo seed.
 * - Every other key lives in object storage; those URLs arrive with uploads (Phase 7). Until then
 *   they resolve to null and the media is skipped.
 */

const DEMO_KEY_PATTERN = /^demo\/[a-z0-9][a-z0-9/_-]*\.(?:webp|jpe?g|png|mp3|m4a|ogg|wav)$/;

export function mediaUrl(key: string): string | null {
  if (DEMO_KEY_PATTERN.test(key) && !key.includes('//')) return `/${key}`;
  return null;
}
