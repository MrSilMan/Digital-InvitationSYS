import { describe, expect, it } from 'vitest';

import { guests } from '@/i18n/pt-AO';
import {
  coupleAnswerSchema,
  EMPTY_GUEST,
  guestSchema,
  inviteMessageSchema,
} from '@/lib/validation/guest';

const valid = { displayName: 'Família Silva', phone: '', seatsAllowed: '4', groupTag: '' };

describe('guest schema', () => {
  it('normalizes a guest for the database', () => {
    expect(
      guestSchema.parse({
        displayName: '  Família   Silva ',
        phone: '923 456 789',
        seatsAllowed: ' 4 ',
        groupTag: ' Família  da noiva ',
      }),
    ).toEqual({
      displayName: 'Família Silva',
      phone: '+244923456789',
      seatsAllowed: 4,
      groupTag: 'Família da noiva',
    });
  });

  it('stores empty optional fields as null', () => {
    expect(guestSchema.parse(valid)).toMatchObject({ phone: null, groupTag: null });
  });

  it('accepts a phone abroad with its country code', () => {
    expect(guestSchema.parse({ ...valid, phone: '+351 912 345 678' }).phone).toBe('+351912345678');
  });

  it.each([
    [{ displayName: '   ' }, 'displayName'],
    [{ displayName: 'x'.repeat(81) }, 'displayName'],
    [{ phone: '12345' }, 'phone'],
    [{ seatsAllowed: '0' }, 'seatsAllowed'],
    [{ seatsAllowed: '21' }, 'seatsAllowed'],
    [{ seatsAllowed: '2.5' }, 'seatsAllowed'],
    [{ seatsAllowed: '' }, 'seatsAllowed'],
    [{ groupTag: 'x'.repeat(41) }, 'groupTag'],
  ])('rejects %j', (change, field) => {
    const result = guestSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([field]);
  });

  it('starts the add form with one seat', () => {
    expect(guestSchema.safeParse({ ...EMPTY_GUEST, displayName: 'Ana' }).success).toBe(true);
  });
});

describe('answer recorded by the couple', () => {
  const schema = coupleAnswerSchema(3);

  it('reads attending with a number of people', () => {
    expect(schema.parse({ attending: 'sim', peopleCount: '2' })).toEqual({
      attending: true,
      peopleCount: 2,
    });
  });

  it('reads "not attending" as zero people and "" as no answer', () => {
    expect(schema.parse({ attending: 'nao', peopleCount: '3' })).toEqual({
      attending: false,
      peopleCount: 0,
    });
    expect(schema.parse({ attending: '', peopleCount: '3' })).toEqual({
      attending: null,
      peopleCount: null,
    });
  });

  it('never allows more people than seats', () => {
    const result = schema.safeParse({ attending: 'sim', peopleCount: '4' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['peopleCount'],
      message: 'Escolha entre 1 e 3 pessoas.',
    });
    expect(schema.safeParse({ attending: 'sim', peopleCount: '0' }).success).toBe(false);
    expect(schema.safeParse({ attending: 'talvez', peopleCount: '1' }).success).toBe(false);
  });
});

describe('invite message', () => {
  it('keeps the couple’s text, with normalized line breaks', () => {
    expect(inviteMessageSchema.parse('  Olá {convidado}!\r\n{link}  ')).toBe(
      'Olá {convidado}!\n{link}',
    );
  });

  it('stores an empty text or a suggested one as null (follows the phase)', () => {
    expect(inviteMessageSchema.parse('   ')).toBeNull();
    expect(inviteMessageSchema.parse(guests.template.defaults.INVITATION)).toBeNull();
    expect(inviteMessageSchema.parse(`${guests.template.defaults.SAVE_THE_DATE}\n`)).toBeNull();
  });

  it('limits the length', () => {
    expect(inviteMessageSchema.safeParse('x'.repeat(1001)).success).toBe(false);
  });
});
