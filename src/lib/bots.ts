/**
 * Link-preview crawlers and search bots. They fetch invitation pages when a link is shared (the
 * WhatsApp preview), so they must not count as a guest opening the invitation, and they are exempt
 * from the per-IP page limit (WhatsApp's crawler fetches every link a couple sends, from few IPs).
 *
 * Next.js's own list (userAgent().isBot) plus the preview crawlers it lacks.
 */
const BOT_USER_AGENT =
  /bot\b|crawler|spider|preview|facebookexternalhit|facebookcatalog|WhatsApp|TelegramBot|Twitterbot|Slackbot|Discordbot|LinkedInBot|SkypeUriPreview|Pinterest|redditbot|Applebot|Googlebot|Google-|Bingbot|BingPreview|yandex|baiduspider|DuckDuckBot|vkShare|Viber|Snapchat|ia_archiver|GPTBot|ClaudeBot/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && BOT_USER_AGENT.test(userAgent));
}
