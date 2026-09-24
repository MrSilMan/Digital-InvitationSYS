import { describe, expect, it } from 'vitest';

import { rsvpAnswerSchema, type RsvpFormValues } from '@/lib/validation/rsvp';

const base: RsvpFormValues = {
  attending: 'sim',
  peopleCount: '3',
  companionNames: ['  Maria Silva ', '', 'Ana Silva'],
  message: '  Até lá!  ',
};

describe('RSVP answer', () => {
  const schema = rsvpAnswerSchema(4);

  it('keeps the companions that fit the party, trimmed, without blanks', () => {
    expect(schema.parse(base)).toEqual({
      attending: true,
      peopleCount: 3,
      companionNames: ['Maria Silva'],
      message: 'Até lá!',
    });
  });

  it('records 0 people and no companions when the guest cannot come', () => {
    expect(schema.parse({ ...base, attending: 'nao', peopleCount: 'anything' })).toEqual({
      attending: false,
      peopleCount: 0,
      companionNames: [],
      message: 'Até lá!',
    });
  });

  it('stores an empty message as null', () => {
    expect(schema.parse({ ...base, message: '   ' }).message).toBeNull();
  });

  it('asks whether the guest will attend', () => {
    const result = schema.safeParse({ ...base, attending: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['attending'],
      message: 'Indique se vai estar presente.',
    });
  });

  it.each(['0', '5', '2.5', '-1', '', 'x'])(
    'enforces the seat limit: %s people for 4 seats is refused',
    (peopleCount) => {
      const result = schema.safeParse({ ...base, peopleCount });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]).toMatchObject({
        path: ['peopleCount'],
        message: 'Escolha entre 1 e 4 pessoas.',
      });
    },
  );

  it('allows no companion names for a single seat', () => {
    const single = rsvpAnswerSchema(1);
    expect(single.parse({ ...base, peopleCount: '1', companionNames: [] }).peopleCount).toBe(1);
    expect(single.safeParse({ ...base, peopleCount: '1', companionNames: ['X'] }).success).toBe(
      false,
    );
  });

  it('limits the length of names and of the message', () => {
    expect(schema.safeParse({ ...base, companionNames: ['x'.repeat(81)] }).success).toBe(false);
    expect(schema.safeParse({ ...base, message: 'x'.repeat(501) }).success).toBe(false);
    expect(schema.safeParse({ ...base, message: 'x'.repeat(500) }).success).toBe(true);
  });

  it('rejects anything that is not a form answer', () => {
    for (const value of [null, 'sim', { attending: true }, { ...base, companionNames: 'Ana' }]) {
      expect(schema.safeParse(value).success).toBe(false);
    }
  });
});
