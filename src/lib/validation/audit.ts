import { z } from 'zod';

/**
 * `AuditLog.metadata`: what the entry needs to stay readable later, even after the target changes
 * or disappears. Only facts about events and accounts: never guest names, phones, passwords or
 * tokens (guests and media are referred to by ID).
 */

const scalarSchema = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);

export type AuditScalar = z.infer<typeof scalarSchema>;

const keySchema = z.string().regex(/^[a-zA-Z]{1,40}$/);

export const auditMetadataSchema = z.object({
  /** What the target was called at the time: the couple's names, the account's e-mail. */
  label: z.string().max(200).optional(),
  /** Changed fields, before and after. */
  changes: z.record(keySchema, z.object({ from: scalarSchema, to: scalarSchema })).optional(),
  /** Other facts: IDs, counts, where the change came from. */
  details: z.record(keySchema, scalarSchema).optional(),
});

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;

/** Stored metadata as written by `recordAudit`; anything unexpected reads as empty. */
export function parseAuditMetadata(value: unknown): AuditMetadata {
  const parsed = auditMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
