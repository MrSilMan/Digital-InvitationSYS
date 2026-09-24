import type { RateLimitPolicy } from './sliding-window';

const MINUTE = 60_000;

/**
 * Every rate limit of the app. Per-IP limits are generous on purpose: Angolan mobile carriers put
 * many phones behind one public IP (carrier-grade NAT), and a couple may send 150 invitations at
 * once. Subjects are hashed in the Redis keys (sliding-window.ts).
 */
export const RATE_LIMITS = {
  /** Login attempts per IP (successful ones count too). */
  loginPerIp: { name: 'login-ip', limit: 20, windowMs: 15 * MINUTE },
  /** Login attempts per e-mail address, whatever the IP (password guessing on one account). */
  loginPerEmail: { name: 'login-email', limit: 8, windowMs: 15 * MINUTE },
  /** Editor saves per user. */
  eventSavesPerUser: { name: 'event-save-user', limit: 60, windowMs: 10 * MINUTE },
  /** Live-preview drafts per user (sent about once a second while typing). */
  previewDraftsPerUser: { name: 'preview-draft-user', limit: 900, windowMs: 10 * MINUTE },
  /** Google Maps short links resolved on the server, per user. */
  mapsLinksPerUser: { name: 'maps-link-user', limit: 30, windowMs: 10 * MINUTE },
  /** Guest pages (/c/…) per IP; link-preview bots are exempt (see proxy.ts). */
  invitationPagesPerIp: { name: 'inv-page-ip', limit: 300, windowMs: 5 * MINUTE },
  /** RSVP form submissions per guest link (answers can be changed a few times). */
  rsvpPerGuest: { name: 'rsvp-guest', limit: 10, windowMs: 10 * MINUTE },
  /** RSVP form submissions per IP (several guests of one household or NAT). */
  rsvpPerIp: { name: 'rsvp-ip', limit: 30, windowMs: 10 * MINUTE },
  /** WhatsApp taps recorded per guest link; over the limit, the tap still opens WhatsApp. */
  whatsappPerGuest: { name: 'whatsapp-guest', limit: 20, windowMs: 10 * MINUTE },
} as const satisfies Record<string, RateLimitPolicy>;
