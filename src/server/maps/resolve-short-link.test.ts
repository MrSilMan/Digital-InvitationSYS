import { describe, expect, it, vi } from 'vitest';

import { resolveShortMapsLink } from './resolve-short-link';

/** A fake fetch that answers each URL with a redirect (or a page) from `routes`. */
function fakeFetch(routes: Record<string, { status: number; location?: string }>) {
  return vi.fn(async (input: URL | RequestInfo) => {
    const url = input instanceof URL ? input.href : String(input);
    const route = routes[url];
    if (!route) throw new Error(`Unexpected request: ${url}`);
    return new Response(null, {
      status: route.status,
      headers: route.location ? { location: route.location } : {},
    });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe('resolveShortMapsLink', () => {
  it('follows Google redirects to the coordinates', async () => {
    const fetch = fakeFetch({
      'https://maps.app.goo.gl/abc123': {
        status: 302,
        location: 'https://www.google.com/maps/place/Praia/data=!3d-8.829!4d13.225',
      },
    });
    await expect(resolveShortMapsLink('https://maps.app.goo.gl/abc123', fetch)).resolves.toEqual({
      ok: true,
      coordinates: { latitude: -8.829, longitude: 13.225 },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('never follows a redirect to another host', async () => {
    const fetch = fakeFetch({
      'https://maps.app.goo.gl/abc123': { status: 302, location: 'http://169.254.169.254/latest' },
    });
    await expect(resolveShortMapsLink('https://maps.app.goo.gl/abc123', fetch)).resolves.toEqual({
      ok: true,
      coordinates: null,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('stops after a few redirects', async () => {
    const fetch = fakeFetch({
      'https://maps.app.goo.gl/loop': { status: 302, location: 'https://maps.app.goo.gl/loop' },
    });
    await expect(resolveShortMapsLink('https://maps.app.goo.gl/loop', fetch)).resolves.toEqual({
      ok: true,
      coordinates: null,
    });
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('refuses anything but a short Google Maps link, and reports network failures', async () => {
    const fetch = fakeFetch({});
    await expect(resolveShortMapsLink('https://evil.example/x', fetch)).resolves.toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(fetch).not.toHaveBeenCalled();
    await expect(resolveShortMapsLink('https://maps.app.goo.gl/down', fetch)).resolves.toEqual({
      ok: false,
      error: 'unavailable',
    });
  });
});
