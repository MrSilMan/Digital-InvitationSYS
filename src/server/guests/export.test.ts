import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';

import type { GuestListItem } from '@/features/dashboard/guests/types';

import { guestsToCsv, spreadsheetPhone } from './export';

function guest(change: Partial<GuestListItem> = {}): GuestListItem {
  return {
    id: '019280a0-0000-7000-8000-000000000001',
    displayName: 'Família Silva',
    phone: '+244923456789',
    seatsAllowed: 4,
    groupTag: 'Família da noiva',
    link: 'https://convites.ao/c/braulio-e-nanda/Abc123Abc123Abc123Abc1',
    sentAt: '2026-09-17T19:00:00.000Z',
    viewCount: 2,
    lastOpenedAt: '2026-09-20T18:40:00.000Z',
    rsvp: {
      attending: true,
      peopleCount: 3,
      companionNames: ['Maria Silva', 'João Silva'],
      message: 'Estaremos lá!',
      source: 'FORM',
      updatedAt: '2026-09-20T18:45:00.000Z',
      whatsappIntentAt: null,
      whatsappIntentTarget: null,
    },
    createdAt: '2026-09-01T10:00:00.000Z',
    ...change,
  };
}

function rows(csv: string): string[][] {
  return Papa.parse<string[]>(csv.slice(Papa.BYTE_ORDER_MARK.length), {
    delimiter: ';',
    skipEmptyLines: true,
  }).data;
}

describe('guest list CSV', () => {
  it('starts with a byte order mark and uses ";" and CRLF (Excel in Portuguese)', () => {
    const csv = guestsToCsv([guest()]);
    expect(csv.startsWith(`${Papa.BYTE_ORDER_MARK}Nome;Telefone;Lugares;Grupo;Link;Estado;`)).toBe(
      true,
    );
    expect(csv.split('\r\n')).toHaveLength(3);
  });

  it('writes one row per guest, dates in Luanda time', () => {
    const [, row] = rows(guestsToCsv([guest()]));
    expect(row).toEqual([
      'Família Silva',
      '923 456 789',
      '4',
      'Família da noiva',
      'https://convites.ao/c/braulio-e-nanda/Abc123Abc123Abc123Abc1',
      'Confirmado',
      '3',
      'Maria Silva, João Silva',
      'Estaremos lá!',
      'Respondeu no convite',
      '20/09/2026, 19h45',
      '17/09/2026, 20h00',
      '2',
      '20/09/2026, 19h40',
    ]);
  });

  it('leaves answer columns empty without an answer', () => {
    const [, row] = rows(
      guestsToCsv([
        guest({
          phone: null,
          groupTag: null,
          sentAt: null,
          viewCount: 0,
          lastOpenedAt: null,
          rsvp: null,
        }),
      ]),
    );
    expect(row?.slice(1, 4)).toEqual(['', '4', '']);
    expect(row?.slice(5)).toEqual(['Ainda não abriu', '', '', '', '', '', '', '0', '']);
  });

  it('keeps formulas written by guests from running in a spreadsheet', () => {
    const csv = guestsToCsv([
      guest({
        displayName: '=HYPERLINK("http://x")',
        rsvp: {
          ...guest().rsvp!,
          message: '+cmd|calc\nsegunda linha',
          companionNames: ['@SUM(1)'],
        },
      }),
    ]);
    const [, row] = rows(csv);
    expect(row?.[0]).toBe(`'=HYPERLINK("http://x")`);
    expect(row?.[7]).toBe(`'@SUM(1)`);
    // Papa Parse's default pattern would miss this one (a line break after the formula).
    expect(row?.[8]).toBe(`'+cmd|calc\nsegunda linha`);
  });

  it('writes phones as text a spreadsheet keeps', () => {
    expect(spreadsheetPhone('+244923456789')).toBe('923 456 789');
    expect(spreadsheetPhone('+351912345678')).toBe('00 351912345678');
  });
});
