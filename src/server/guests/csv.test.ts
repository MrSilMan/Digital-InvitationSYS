import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';

import { validation } from '@/i18n/pt-AO';
import { IMPORT_LIMITS } from '@/lib/guests/import';

import {
  decodeCsvBytes,
  guestIdentity,
  importErrorsCsv,
  importTemplateCsv,
  parseGuestCsv,
  validateGuestRows,
} from './csv';
import { guestsToCsv } from './export';

const utf8 = (text: string) => new TextEncoder().encode(text);

function rowsOf(text: string) {
  const parsed = parseGuestCsv(text);
  if (!parsed.ok) throw new Error(`Expected rows, got ${parsed.failure}`);
  return parsed.rows;
}

function readCsv(csv: string): string[][] {
  return Papa.parse<string[]>(csv.slice(Papa.BYTE_ORDER_MARK.length), {
    delimiter: ';',
    skipEmptyLines: true,
  }).data;
}

describe('decoding an uploaded file', () => {
  it('reads UTF-8 and drops the byte order mark', () => {
    expect(decodeCsvBytes(utf8(`${Papa.BYTE_ORDER_MARK}nome\nFamília Conceição`))).toBe(
      'nome\nFamília Conceição',
    );
  });

  it('reads Windows-1252 (Excel’s plain CSV) when the bytes are not UTF-8', () => {
    // "Família" with í as the single byte 0xED.
    const bytes = Uint8Array.from([0x46, 0x61, 0x6d, 0xed, 0x6c, 0x69, 0x61]);
    expect(decodeCsvBytes(bytes)).toBe('Família');
  });
});

describe('reading the rows', () => {
  it('guesses ";" or "," and finds the columns in any order, case or accents', () => {
    const semicolon = rowsOf('Grupo;NOME;Telemóvel;Lugares\nAmigos;Ana e Pedro;923 456 789;2');
    const comma = rowsOf('name,phone,seats,group\n"Silva, Família",923456789,4,Amigos');
    expect(semicolon[0]?.values).toEqual({
      nome: 'Ana e Pedro',
      telefone: '923 456 789',
      lugares: '2',
      grupo: 'Amigos',
    });
    expect(comma[0]?.values.nome).toBe('Silva, Família');
  });

  it('numbers rows as a spreadsheet does and skips empty lines', () => {
    const rows = rowsOf('\nnome;telefone\nAna;\n;\n\nBruno;\n');
    expect(rows.map((row) => [row.row, row.values.nome])).toEqual([
      [3, 'Ana'],
      [6, 'Bruno'],
    ]);
  });

  it('needs only the name column; missing columns are empty', () => {
    expect(rowsOf('Nome do convidado\nTia Rosa')[0]?.values).toEqual({
      nome: 'Tia Rosa',
      telefone: '',
      lugares: '',
      grupo: '',
    });
  });

  it('undoes the apostrophe our export puts before formula-like text', () => {
    expect(rowsOf("nome;telefone\n'=Ana;'+351 912 345 678")[0]?.values).toMatchObject({
      nome: '=Ana',
      telefone: '+351 912 345 678',
    });
  });

  it('refuses a file without guests, without a name column, or too long', () => {
    expect(parseGuestCsv('')).toEqual({ ok: false, failure: 'empty' });
    expect(parseGuestCsv('nome;telefone\n;\n')).toEqual({ ok: false, failure: 'empty' });
    expect(parseGuestCsv('Família Silva;923456789\nAna;')).toEqual({
      ok: false,
      failure: 'no-name-column',
    });
    const long = ['nome', ...Array.from({ length: IMPORT_LIMITS.maxRows + 1 }, (_, i) => `G${i}`)];
    expect(parseGuestCsv(long.join('\n'))).toEqual({ ok: false, failure: 'too-many-rows' });
  });

  it('reads back its own export (the first columns are the import’s)', () => {
    const csv = guestsToCsv([
      {
        id: '019280a0-0000-7000-8000-000000000001',
        displayName: 'Família Silva',
        phone: '+351912345678',
        seatsAllowed: 4,
        groupTag: 'Amigos',
        link: 'https://convites.ao/c/x/Abc123Abc123Abc123Abc1',
        sentAt: null,
        viewCount: 0,
        lastOpenedAt: null,
        rsvp: null,
        createdAt: '2026-09-01T10:00:00.000Z',
      },
    ]);
    const [row] = validateGuestRows(rowsOf(decodeCsvBytes(utf8(csv)))).valid;
    expect(row?.data).toEqual({
      displayName: 'Família Silva',
      phone: '+351912345678',
      seatsAllowed: 4,
      groupTag: 'Amigos',
    });
  });
});

describe('checking the rows', () => {
  it('validates each row like the form; empty seats count as one', () => {
    const { valid, invalid } = validateGuestRows(
      rowsOf('nome;telefone;lugares;grupo\nAna;923 456 789;;Amigos\n;12345;0;\nBruno;;3;'),
    );
    expect(valid.map((row) => row.data)).toEqual([
      { displayName: 'Ana', phone: '+244923456789', seatsAllowed: 1, groupTag: 'Amigos' },
      { displayName: 'Bruno', phone: null, seatsAllowed: 3, groupTag: null },
    ]);
    expect(invalid).toEqual([
      {
        row: 3,
        kind: 'invalid',
        values: { nome: '', telefone: '12345', lugares: '0', grupo: '' },
        issues: [
          { column: 'nome', message: 'Preencha este campo.' },
          { column: 'telefone', message: validation.phone.invalidGuest },
          { column: 'lugares', message: 'Escolha entre 1 e 20 lugares.' },
        ],
      },
    ]);
  });

  it('knows the same guest by name (any case, accents, spaces) and phone', () => {
    const a = guestIdentity({ displayName: 'Família  Silva', phone: '+244923456789' });
    expect(guestIdentity({ displayName: 'familia silva', phone: '+244923456789' })).toBe(a);
    expect(guestIdentity({ displayName: 'Família Silva', phone: null })).not.toBe(a);
  });
});

describe('files offered for download', () => {
  it('writes the rows with errors, ready to fix and import again', () => {
    const { invalid } = validateGuestRows(rowsOf('nome;telefone;lugares;grupo\nAna;123;2;Amigos'));
    const csv = importErrorsCsv([
      ...invalid,
      {
        row: 9,
        kind: 'duplicate',
        values: { nome: 'B', telefone: '', lugares: '', grupo: '' },
        issues: [],
      },
    ]);
    expect(readCsv(csv)).toEqual([
      ['nome', 'telefone', 'lugares', 'grupo', 'linha', 'erro'],
      ['Ana', '123', '2', 'Amigos', '2', `telefone: ${validation.phone.invalidGuest}`],
    ]);
    // Imported again, only the error columns are ignored.
    expect(rowsOf(decodeCsvBytes(utf8(csv)))[0]?.values.nome).toBe('Ana');
  });

  it('offers a template that imports as it is', () => {
    const rows = rowsOf(decodeCsvBytes(utf8(importTemplateCsv())));
    expect(validateGuestRows(rows).invalid).toEqual([]);
    expect(rows).toHaveLength(2);
  });
});
