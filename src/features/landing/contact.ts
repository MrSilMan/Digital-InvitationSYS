import { whatsappUrl } from '@/features/invitation/links';
import { landing } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

/**
 * Couples do not sign up on their own: the team creates their accounts (SPEC §7). Every "create"
 * button on the landing page opens a WhatsApp chat with the team (CONTACT_WHATSAPP).
 */

/**
 * Stands in for CONTACT_WHATSAPP where it may be unset (development, tests): the unassigned
 * +244 900 000 xxx range of the demo data, so a test click never reaches a real person.
 */
export const PLACEHOLDER_CONTACT_WHATSAPP = '+244900000000';

export function contactWhatsapp(configured: string | undefined): string {
  return configured ?? PLACEHOLDER_CONTACT_WHATSAPP;
}

/** wa.me link with a pre-filled message; with a theme name, the message asks for that theme. */
export function contactUrl(phone: string, themeName?: string): string {
  const message = themeName
    ? fillTemplate(landing.cta.messageWithTheme, { theme: themeName })
    : landing.cta.message;
  return whatsappUrl(phone, message);
}
