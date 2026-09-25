import { z } from 'zod';

/** Media.variants for images, written by the worker: one WebP file per width ("w480": …). */
export const imageVariantsSchema = z.record(
  z.string(),
  z.object({
    key: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
);
export type ImageVariants = z.infer<typeof imageVariantsSchema>;

/** Media.variants for music: the checked MP3, without its tags. */
export const audioVariantsSchema = z.object({
  audio: z.object({ key: z.string(), bytes: z.number().int().nonnegative() }),
});
export type AudioVariants = z.infer<typeof audioVariantsSchema>;

/** The processed files of an image, narrowest first (none: not processed, or unreadable JSON). */
export function imageFiles(variants: unknown): ImageVariants[string][] {
  const parsed = imageVariantsSchema.safeParse(variants ?? {});
  if (!parsed.success) return [];
  return Object.values(parsed.data).sort((a, b) => a.width - b.width);
}

/** The processed MP3's key, or null. */
export function audioFileKey(variants: unknown): string | null {
  const parsed = audioVariantsSchema.safeParse(variants);
  return parsed.success ? parsed.data.audio.key : null;
}
