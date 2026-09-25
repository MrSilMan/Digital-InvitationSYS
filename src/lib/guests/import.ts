import { z } from 'zod';

/**
 * What a CSV import of guests looks like to both sides: the columns, the limits, why a whole file
 * can fail, and the report of rows that were not imported (stored as JSON, validated when read).
 * Browser-safe: the parsing itself is server-only (src/server/guests/csv.ts).
 */

/** The columns of the file, in the order of the template and the export. */
export const IMPORT_COLUMNS = ['nome', 'telefone', 'lugares', 'grupo'] as const;
export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

export const IMPORT_LIMITS = {
  /** Upload size (a Server Action accepts 1 MB; 2,000 rows of guests are far smaller). */
  maxBytes: 512 * 1024,
  /** Data rows per file. */
  maxRows: 2_000,
  /** Imports an event keeps (with their reports); older ones are deleted. */
  kept: 5,
  /** Rows listed in a report (the counts stay exact). */
  reportedProblems: 500,
} as const;

/** Why nothing was imported. */
export const IMPORT_FAILURES = [
  'empty',
  'no-name-column',
  'too-many-rows',
  'limit',
  'error',
] as const;
export type ImportFailure = (typeof IMPORT_FAILURES)[number];

export function toImportFailure(value: string | null): ImportFailure | null {
  return (IMPORT_FAILURES as readonly string[]).includes(value ?? '')
    ? (value as ImportFailure)
    : null;
}

const columnValues = z.object({
  nome: z.string(),
  telefone: z.string(),
  lugares: z.string(),
  grupo: z.string(),
});

const problemSchema = z.object({
  /** Row number as a spreadsheet shows it (the header is row 1). */
  row: z.number().int().positive(),
  /** "invalid": a field is wrong; "duplicate": the same guest (name and phone) is on the list. */
  kind: z.enum(['invalid', 'duplicate']),
  values: columnValues,
  issues: z.array(z.object({ column: z.enum(IMPORT_COLUMNS), message: z.string() })),
});
export type ImportProblem = z.infer<typeof problemSchema>;

export const importReportSchema = z.object({
  problems: z.array(problemSchema),
  /** Invalid rows in the file (may exceed the problems listed). */
  invalid: z.number().int().nonnegative().default(0),
  /** With failure "limit": new guests in the file, and room left in the plan. */
  wanted: z.number().int().nonnegative().optional(),
  room: z.number().int().nonnegative().optional(),
});
export type ImportReport = z.infer<typeof importReportSchema>;

export function parseImportReport(value: unknown): ImportReport {
  const parsed = importReportSchema.safeParse(value);
  return parsed.success ? parsed.data : { problems: [], invalid: 0 };
}
