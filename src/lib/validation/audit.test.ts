import { describe, expect, it } from 'vitest';

import { AUDIT_ACTIONS, isAuditAction } from '@/lib/audit/actions';
import { admin } from '@/i18n/pt-AO';

import { auditMetadataSchema, parseAuditMetadata } from './audit';

describe('audit actions', () => {
  it('match the database CHECK constraint and have a label each', () => {
    for (const action of AUDIT_ACTIONS) {
      expect(action).toMatch(/^[a-z]+(\.[a-z]+(-[a-z]+)*)+$/);
      expect(admin.audit.actions[action]).toBeTruthy();
    }
    expect(new Set(AUDIT_ACTIONS).size).toBe(AUDIT_ACTIONS.length);
    expect(isAuditAction('event.activate')).toBe(true);
    expect(isAuditAction('event.drop')).toBe(false);
  });
});

describe('audit metadata', () => {
  it('keeps labels, before/after changes and plain details', () => {
    const metadata = {
      label: 'Braúlio & Nanda',
      changes: { guestLimit: { from: 150, to: 200 }, isActive: { from: true, to: false } },
      details: { via: 'cli', newAccount: true, owner: null },
    };
    expect(auditMetadataSchema.parse(metadata)).toEqual(metadata);
  });

  it('refuses nested objects and odd keys (nothing but plain facts is stored)', () => {
    expect(auditMetadataSchema.safeParse({ details: { guest: { name: 'Ana' } } }).success).toBe(
      false,
    );
    expect(auditMetadataSchema.safeParse({ details: { 'x.y': 1 } }).success).toBe(false);
  });

  it('reads anything unexpected as empty', () => {
    expect(parseAuditMetadata(null)).toEqual({});
    expect(parseAuditMetadata('texto')).toEqual({});
    expect(parseAuditMetadata({ label: 5 })).toEqual({});
  });
});
