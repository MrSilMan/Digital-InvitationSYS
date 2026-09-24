import { describe, expect, it } from 'vitest';

import { googleMapsUrl, wazeUrl, whatsappUrl } from '@/features/invitation/links';
import { invitationEventFixture } from '@/features/invitation/test-fixtures';
import {
  capitalize,
  coupleNames,
  coupleNamesShort,
  fillTemplate,
} from '@/features/invitation/text';

const [beach, hall] = invitationEventFixture().locations;

describe('WhatsApp link', () => {
  it('opens a chat with the number (digits only) and the encoded message', () => {
    const url = whatsappUrl('+244900000001', 'Olá! Sou Família Silva & cia.');
    expect(url).toBe(
      'https://wa.me/244900000001?text=Ol%C3%A1!%20Sou%20Fam%C3%ADlia%20Silva%20%26%20cia.',
    );
  });
});

describe('map links', () => {
  it("prefer the couple's Google Maps link", () => {
    expect(googleMapsUrl(beach!)).toBe(beach!.mapsUrl);
  });

  it('fall back to a search for the venue and address', () => {
    expect(googleMapsUrl(hall!)).toBe(
      'https://www.google.com/maps/search/?api=1&query=Sal%C3%A3o%20de%20Festas%20Jardim%20das%20Rosas%2C%20Morro%20Bento%2C%20Luanda',
    );
    const withCoordinates = { ...hall!, latitude: -8.896, longitude: 13.19 };
    expect(googleMapsUrl(withCoordinates)).toBe(
      'https://www.google.com/maps/search/?api=1&query=-8.896%2C13.19',
    );
  });

  it('offer Waze only with coordinates', () => {
    expect(wazeUrl(beach!)).toBe('https://waze.com/ul?ll=-8.829,13.225&navigate=yes');
    expect(wazeUrl(hall!)).toBeNull();
  });
});

describe('text helpers', () => {
  it('fill placeholders and keep unknown ones', () => {
    expect(fillTemplate('{a} e {b} {c}', { a: 'Braúlio', b: 'Nanda' })).toBe('Braúlio e Nanda {c}');
  });

  it("write the couple's names", () => {
    const event = invitationEventFixture();
    expect(coupleNames(event)).toBe('Braúlio e Nanda');
    expect(coupleNamesShort(event)).toBe('Braúlio & Nanda');
  });

  it('capitalize the first letter only', () => {
    expect(capitalize('sexta-feira, 15 de janeiro')).toBe('Sexta-feira, 15 de janeiro');
    expect(capitalize('égua')).toBe('Égua');
    expect(capitalize('')).toBe('');
  });
});
