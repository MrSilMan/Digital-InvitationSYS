/**
 * Event slugs, the event's part of every guest link (/c/<slug>/<token>): lowercase ASCII words
 * joined by hyphens (`isEventSlug`, also a database CHECK constraint). The admin area suggests one
 * from the couple's names; it never changes afterwards (sent links contain it).
 */

export const EVENT_SLUG_MAX_LENGTH = 80;

/** "Braúlio Nóbrega" → "braulio-nobrega": no accents, anything else becomes a hyphen. */
export function toSlugPart(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fit(slug: string, maxLength: number): string {
  return slug.slice(0, maxLength).replace(/-+$/, '');
}

/** "Braúlio" and "Nanda" → "braulio-e-nanda". Empty when neither name has a letter or digit. */
export function suggestEventSlug(groomName: string, brideName: string): string {
  const parts = [groomName, brideName].map(toSlugPart).filter(Boolean);
  return fit(parts.join('-e-'), EVENT_SLUG_MAX_LENGTH);
}

/** `base` if free, else base-2, base-3… (`taken`: the slugs already in use). */
export function nextFreeSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${fit(base, EVENT_SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
