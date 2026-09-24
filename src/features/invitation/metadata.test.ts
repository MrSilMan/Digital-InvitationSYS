import { describe, expect, it } from 'vitest';

import { invitationDescription, invitationTitle } from '@/features/invitation/metadata';
import { invitationEventFixture } from '@/features/invitation/test-fixtures';

describe('WhatsApp preview texts', () => {
  it('name the couple, per phase', () => {
    expect(invitationTitle(invitationEventFixture())).toBe(
      'Convite de Casamento – Braúlio & Nanda',
    );
    expect(invitationTitle(invitationEventFixture({ phase: 'SAVE_THE_DATE' }))).toBe(
      'Save the Date – Braúlio & Nanda',
    );
  });

  it('give the date in Luanda time, never the guest', () => {
    const description = invitationDescription(invitationEventFixture());
    expect(description).toBe('Sexta-feira, 15 de janeiro de 2027. Toque para abrir o seu convite.');
    expect(description).not.toContain('Silva');
  });
});
