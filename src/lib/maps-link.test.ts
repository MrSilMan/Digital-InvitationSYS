import { describe, expect, it } from 'vitest';

import { isGoogleMapsUrl, isShortMapsUrl, parseMapsCoordinates } from './maps-link';

describe('parseMapsCoordinates', () => {
  it.each([
    [
      'place page: the pin wins over the map centre',
      'https://www.google.com/maps/place/Praia+do+Bispo/@-8.8200,13.2200,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-8.8290!4d13.2250',
      { latitude: -8.829, longitude: 13.225 },
    ],
    [
      'search link',
      'https://www.google.com/maps/search/?api=1&query=-8.8290,13.2250',
      { latitude: -8.829, longitude: 13.225 },
    ],
    [
      'q parameter',
      'https://maps.google.com/?q=-8.896,13.19',
      { latitude: -8.896, longitude: 13.19 },
    ],
    [
      'coordinates in the path',
      'https://www.google.com/maps/search/-8.829,+13.225?entry=tts',
      { latitude: -8.829, longitude: 13.225 },
    ],
    [
      'map centre only',
      'https://www.google.co.ao/maps/@-8.83,13.23,15z',
      { latitude: -8.83, longitude: 13.23 },
    ],
    [
      'consent page wrapping the real link',
      `https://consent.google.com/ml?continue=${encodeURIComponent('https://www.google.com/maps/place/X/data=!3d-8.9!4d13.1')}`,
      { latitude: -8.9, longitude: 13.1 },
    ],
  ])('reads a %s', (_, link, expected) => {
    expect(parseMapsCoordinates(link)).toEqual(expected);
  });

  it('returns null without coordinates, or with impossible ones', () => {
    expect(parseMapsCoordinates('https://www.google.com/maps/place/Praia+do+Bispo')).toBeNull();
    expect(parseMapsCoordinates('https://maps.app.goo.gl/abc123')).toBeNull();
    expect(parseMapsCoordinates('https://maps.google.com/?q=Luanda')).toBeNull();
    expect(parseMapsCoordinates('https://maps.google.com/?q=95.1,13.2')).toBeNull();
    expect(parseMapsCoordinates('não é um link')).toBeNull();
    expect(parseMapsCoordinates('javascript:alert(1)')).toBeNull();
  });
});

describe('Google Maps link kinds', () => {
  it('recognizes long and short Google Maps links only', () => {
    expect(isGoogleMapsUrl('https://www.google.com/maps/place/X')).toBe(true);
    expect(isGoogleMapsUrl('https://maps.google.pt/?q=Luanda')).toBe(true);
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(isGoogleMapsUrl('https://www.google.com/search?q=maps')).toBe(false);
    expect(isGoogleMapsUrl('https://maps.evil.example/maps')).toBe(false);
    expect(isShortMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(isShortMapsUrl('https://goo.gl/maps/abc123')).toBe(true);
    expect(isShortMapsUrl('https://goo.gl/abc123')).toBe(false);
    expect(isShortMapsUrl('http://evil.example/maps.app.goo.gl')).toBe(false);
  });
});
