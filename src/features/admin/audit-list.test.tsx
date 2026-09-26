import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { AuditEntryView } from '@/server/audit/queries';

import { AuditList } from './audit-list';

// 12:00 in Luanda on Saturday, 26 September 2026.
const now = new Date('2026-09-26T11:00:00Z');

const base: AuditEntryView = {
  id: '0199f000-0000-7000-8000-000000000001',
  createdAt: new Date('2026-09-25T09:05:00Z'),
  action: 'event.guest-limit',
  actor: { id: 'admin-1', name: 'Administrador' },
  target: {
    type: 'event',
    id: '0199f000-0000-7000-8000-0000000000aa',
    name: 'Braúlio & Nanda',
    exists: true,
  },
  metadata: { changes: { guestLimit: { from: 150, to: 200 } } },
};

describe('AuditList', () => {
  it('shows what changed, where, by whom and when (Luanda time)', () => {
    const html = renderToStaticMarkup(<AuditList entries={[base]} now={now} />);
    expect(html).toContain('Alterou o limite de convidados');
    expect(html).toContain('href="/admin/eventos/0199f000-0000-7000-8000-0000000000aa"');
    expect(html).toContain('Braúlio &amp; Nanda');
    expect(html).toContain('href="/admin/contas/admin-1"');
    expect(html).toContain('Limite de convidados: 150 → 200');
    expect(html).toContain('>10h05</time>');
    expect(html).toContain('dateTime="2026-09-25T10:05+01:00"');
  });

  it('groups the entries by Luanda day, newest first', () => {
    const html = renderToStaticMarkup(
      <AuditList
        now={now}
        headingLevel={3}
        entries={[
          // 00:30 on the 26th in Luanda: today, although still the 25th in UTC.
          { ...base, id: 'a', createdAt: new Date('2026-09-25T23:30:00Z') },
          { ...base, id: 'b', createdAt: new Date('2026-09-25T09:05:00Z') },
          { ...base, id: 'c', createdAt: new Date('2026-09-20T09:05:00Z') },
        ]}
      />,
    );
    const headings = [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((match) => match[1]);
    expect(headings).toEqual(['Hoje', 'Ontem', 'Domingo, 20 de setembro de 2026']);
  });

  it('names the command line and deleted accounts, and words stored values', () => {
    const html = renderToStaticMarkup(
      <AuditList
        now={now}
        entries={[
          {
            ...base,
            id: 'a',
            action: 'user.create',
            actor: null,
            target: { type: 'user', id: 'u-1', name: 'ana@exemplo.ao', exists: false },
            metadata: { label: 'ana@exemplo.ao', details: { role: 'admin', via: 'cli' } },
          },
          {
            ...base,
            id: 'b',
            action: 'guest.export',
            actor: null,
            metadata: { details: { file: 'list', rows: 12 } },
          },
        ]}
      />,
    );
    expect(html).toContain('Linha de comandos');
    expect(html).toContain('Conta apagada');
    expect(html).toContain('Função: administrador');
    expect(html).toContain('Ficheiro: lista de convidados');
    // A target that no longer exists is named, not linked; "via" is not repeated as a detail.
    expect(html).not.toContain('/admin/contas/u-1');
    expect(html).not.toContain('Origem');
  });

  it('says so when there is nothing yet', () => {
    expect(renderToStaticMarkup(<AuditList entries={[]} now={now} />)).toContain(
      'Sem atividade registada.',
    );
  });
});
