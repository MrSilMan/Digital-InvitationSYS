import { describe, expect, it } from 'vitest';

import { isBotUserAgent } from '@/lib/bots';
import { clientIp } from '@/lib/client-ip';

describe('client IP', () => {
  it("takes the closest proxy's entry: the right-most X-Forwarded-For value", () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }))).toBe(
      '203.0.113.9',
    );
    expect(clientIp(new Headers({ 'x-forwarded-for': '2001:db8::1' }))).toBe('2001:db8::1');
  });

  it('unwraps IPv4-mapped IPv6 addresses and falls back to X-Real-IP', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '::ffff:198.51.100.7' }))).toBe(
      '198.51.100.7',
    );
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.8' }))).toBe('198.51.100.8');
  });

  it('never trusts a value that is not an IP address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': 'evil<script>' }))).toBe('unknown');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});

describe('bot user agents', () => {
  it.each([
    'WhatsApp/2.24.1.0 A',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'TelegramBot (like TwitterBot)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  ])('recognizes %s', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0 Mobile Safari/537.36 [FBAN/EMA;FBLC/pt_PT]',
  ])('lets a guest through: %s', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(false);
  });

  it('treats a missing user agent as a guest', () => {
    expect(isBotUserAgent(null)).toBe(false);
  });
});
