import { describe, expect, it } from 'vitest';

import { DEFAULT_GUEST_RULES } from '@/lib/event-defaults';

describe('default guest rules', () => {
  it('are the 8 rules of the reference, in order, each with an icon', () => {
    expect(DEFAULT_GUEST_RULES.map((rule) => rule.text)).toEqual([
      'Contamos com a sua presença!',
      'Seja pontual!',
      'Convidado não convida!',
      'Comemore a nossa união!',
      'Branco é a cor da noiva!',
      'Faça muitas fotos e Stories!',
      'É obrigatório dançar muito!',
      'Sorria e seja muito feliz!',
    ]);
    for (const rule of DEFAULT_GUEST_RULES) expect(rule.icon).toMatch(/^[a-z-]+$/);
  });
});
