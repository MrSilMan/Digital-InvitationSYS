import { servedPath } from '@/lib/media/keys';

/**
 * Public URLs of stored media.
 *
 * - `demo/…` keys: files shipped in /public/demo for the demo seed.
 * - `media/…` keys: files the worker processed, served by the app at /m/… from the private bucket
 *   (app/m/[...key]/route.ts). A CDN in front later would change this function only.
 * - Anything else (originals, unknown keys) has no public URL.
 */

const DEMO_KEY_PATTERN = /^demo\/[a-z0-9][a-z0-9/_-]*\.(?:webp|jpe?g|png|mp3|m4a|ogg|wav)$/;

export function mediaUrl(key: string): string | null {
  if (DEMO_KEY_PATTERN.test(key) && !key.includes('//')) return `/${key}`;
  return servedPath(key);
}
