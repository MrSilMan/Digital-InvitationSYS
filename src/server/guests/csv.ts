import 'server-only';

import Papa from 'papaparse';

import { guests } from '@/i18n/pt-AO';
import { searchKey } from '@/lib/guests/filters';
import {
  IMPORT_COLUMNS,
  IMPORT_LIMITS,
  type ImportColumn,
  type ImportFailure,
  type ImportProblem,
} from '@/lib/guests/import';
import { type GuestData, guestSchema } from '@/lib/validation/guest';

/**
 * Reading a CSV file of guests (no database here: src/server/guests/import.ts saves them).
 *
 * Files come from Excel, Google Sheets or LibreOffice, in Portuguese or English settings: the
 * delimiter is guessed (";", "," or tab), the header may be in any case, with or without accents
 * or in English, and a file that is not valid UTF-8 is read as Windows-1252 (Excel's plain "CSV"
 * on Windows). Every row goes through the same schema as the dashboard form.
 */

/** Our CSV files: ";" between columns, UTF-8 with a byte order mark, CRLF. */
const FORMULA_START = /^[=+\-@\t\r]/;
export function writeCsv(fields: readonly string[], rows: readonly (string | number)[][]): string {
  const csv = Papa.unparse(
    { fields: [...fields], data: rows.map((row) => [...row]) },
    { delimiter: ';', newline: '\r\n', escapeFormulae: FORMULA_START },
  );
  return `${Papa.BYTE_ORDER_MARK}${csv}\r\n`;
}

/** The bytes of an uploaded file as text: UTF-8 (byte order mark dropped), else Windows-1252. */
export function decodeCsvBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Accepted header names, compared lowercase without accents, spaces or punctuation. */
const HEADER_NAMES: Record<ImportColumn, readonly string[]> = {
  nome: ['nome', 'nomes', 'name', 'convidado', 'convidados', 'nomedoconvidado', 'nomenoconvite'],
  telefone: [
    'telefone',
    'telemovel',
    'telefones',
    'phone',
    'whatsapp',
    'numero',
    'contacto',
    'contato',
    'celular',
    'tel',
  ],
  lugares: ['lugares', 'lugar', 'pessoas', 'seats', 'quantidade', 'qtd'],
  grupo: ['grupo', 'group', 'categoria', 'lado'],
};

const headerKey = (cell: string) => searchKey(cell).replace(/[^a-z0-9]/g, '');

/** A cell as typed; our own export's formula guard (a leading apostrophe) is undone. */
function cellValue(cell: string | undefined): string {
  const value = (cell ?? '').trim();
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

export interface CsvRow {
  /** Row number as a spreadsheet shows it (the header is row 1). */
  row: number;
  values: Record<ImportColumn, string>;
}

export type ParsedCsv = { ok: true; rows: CsvRow[] } | { ok: false; failure: ImportFailure };

const DELIMITERS = [';', ',', '\t'] as const;

/**
 * The delimiter used most on the header line (the first line with text). Papa Parse's own guess
 * looks at the whole file and is thrown by empty rows (";;;") and single-column files.
 */
function headerDelimiter(text: string): string {
  const header = text.split(/\r\n|\n|\r/).find((line) => line.trim() !== '') ?? '';
  let best: string = ',';
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const count = header.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

export function parseGuestCsv(text: string): ParsedCsv {
  const { data } = Papa.parse<string[]>(text, {
    delimiter: headerDelimiter(text),
    skipEmptyLines: false,
  });
  const headerIndex = data.findIndex((cells) => cells.some((cell) => cell.trim() !== ''));
  if (headerIndex < 0) return { ok: false, failure: 'empty' };

  const positions: Partial<Record<ImportColumn, number>> = {};
  (data[headerIndex] ?? []).forEach((cell, index) => {
    const key = headerKey(cell);
    const column = IMPORT_COLUMNS.find((name) => HEADER_NAMES[name].includes(key));
    if (column && positions[column] === undefined) positions[column] = index;
  });
  if (positions.nome === undefined) return { ok: false, failure: 'no-name-column' };

  const rows: CsvRow[] = [];
  for (let index = headerIndex + 1; index < data.length; index += 1) {
    const cells = data[index] ?? [];
    const values = Object.fromEntries(
      IMPORT_COLUMNS.map((column) => {
        const position = positions[column];
        return [column, position === undefined ? '' : cellValue(cells[position])];
      }),
    ) as Record<ImportColumn, string>;
    if (IMPORT_COLUMNS.some((column) => values[column] !== '')) {
      rows.push({ row: index + 1, values });
    }
  }
  if (rows.length === 0) return { ok: false, failure: 'empty' };
  if (rows.length > IMPORT_LIMITS.maxRows) return { ok: false, failure: 'too-many-rows' };
  return { ok: true, rows };
}

const FIELD_COLUMNS: Record<keyof GuestData, ImportColumn> = {
  displayName: 'nome',
  phone: 'telefone',
  seatsAllowed: 'lugares',
  groupTag: 'grupo',
};

export interface ValidRow {
  row: number;
  values: Record<ImportColumn, string>;
  data: GuestData;
}

/** Each row through the guest schema; an empty "lugares" counts as one seat. */
export function validateGuestRows(rows: readonly CsvRow[]): {
  valid: ValidRow[];
  invalid: ImportProblem[];
} {
  const valid: ValidRow[] = [];
  const invalid: ImportProblem[] = [];
  for (const { row, values } of rows) {
    const parsed = guestSchema.safeParse({
      displayName: values.nome,
      phone: values.telefone,
      seatsAllowed: values.lugares || '1',
      groupTag: values.grupo,
    });
    if (parsed.success) {
      valid.push({ row, values, data: parsed.data });
      continue;
    }
    const issues = parsed.error.issues.map((issue) => ({
      column: FIELD_COLUMNS[issue.path[0] as keyof GuestData] ?? 'nome',
      message: issue.message,
    }));
    invalid.push({ row, kind: 'invalid', values, issues });
  }
  return { valid, invalid };
}

/** Same guest: same name (ignoring case, accents and spaces) and same phone (or both without). */
export function guestIdentity(guest: { displayName: string; phone: string | null }): string {
  return `${searchKey(guest.displayName).replace(/\s+/g, ' ').trim()}|${guest.phone ?? ''}`;
}

const t = guests.import;

/** The rows that failed, to fix and import again: the import's columns, then "linha" and "erro". */
export function importErrorsCsv(problems: readonly ImportProblem[]): string {
  const rows = problems
    .filter((problem) => problem.kind === 'invalid')
    .map((problem) => [
      ...IMPORT_COLUMNS.map((column) => problem.values[column]),
      problem.row,
      problem.issues.map((issue) => `${issue.column}: ${issue.message}`).join(' '),
    ]);
  return writeCsv([...IMPORT_COLUMNS, t.errorColumns.row, t.errorColumns.error], rows);
}

/** The template offered for download: the columns and two example guests. */
export function importTemplateCsv(): string {
  return writeCsv(
    IMPORT_COLUMNS,
    t.templateRows.map((row) => [...row]),
  );
}
