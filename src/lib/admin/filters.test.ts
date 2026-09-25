import { describe, expect, it } from 'vitest';

import {
  accountListQuery,
  auditQuery,
  eventListQuery,
  parseAccountListFilters,
  parseAuditFilters,
  parseEventListFilters,
} from './filters';

describe('event list filters', () => {
  it('reads the Portuguese URL parameters and writes them back', () => {
    const filters = parseEventListFilters({
      q: '  silva   nanda ',
      estado: 'desativados',
      pagina: '3',
    });
    expect(filters).toEqual({ query: 'silva nanda', status: 'inactive', page: 3 });
    expect(eventListQuery(filters)).toBe('?q=silva+nanda&estado=desativados&pagina=3');
  });

  it('ignores unknown or hostile values', () => {
    expect(parseEventListFilters({ estado: 'todos', pagina: '-1', q: ['a', 'b'] })).toEqual({
      query: 'a',
      status: null,
      page: 1,
    });
    expect(parseEventListFilters({ pagina: '99999999' }).page).toBe(1);
    expect(parseEventListFilters({ q: 'x'.repeat(500) }).query).toHaveLength(80);
  });

  it('leaves the first page and empty filters out of the URL', () => {
    expect(eventListQuery({ query: '', status: null, page: 1 })).toBe('');
    expect(eventListQuery({ status: 'active', page: 2 })).toBe('?estado=ativos&pagina=2');
  });
});

describe('account list filters', () => {
  it('reads and writes the status', () => {
    expect(parseAccountListFilters({ estado: 'suspensas' }).status).toBe('suspended');
    expect(accountListQuery({ status: 'active', query: 'ana' })).toBe('?q=ana&estado=ativas');
  });
});

describe('audit log filters', () => {
  it('accepts known actions and one target', () => {
    const eventId = '0199f000-0000-7000-8000-000000000001';
    const filters = parseAuditFilters({ acao: 'event.activate', evento: eventId, pagina: '2' });
    expect(filters).toEqual({
      action: 'event.activate',
      target: { type: 'event', id: eventId },
      page: 2,
    });
    expect(auditQuery(filters)).toBe(`?acao=event.activate&evento=${eventId}&pagina=2`);
    expect(parseAuditFilters({ conta: 'abc-123' }).target).toEqual({ type: 'user', id: 'abc-123' });
  });

  it('drops unknown actions and malformed IDs', () => {
    expect(parseAuditFilters({ acao: 'event.drop', evento: "1' OR 1=1" })).toEqual({
      action: null,
      target: null,
      page: 1,
    });
  });
});
