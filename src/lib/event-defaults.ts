import { invitationDefaults } from '@/i18n/pt-AO';

/**
 * Content every new event starts with (the seed now, the dashboard in Phase 7).
 * Icon keys name icons of the invitation icon set introduced in Phase 3.
 */

type GuestRuleKey = keyof typeof invitationDefaults.guestRules;

const GUEST_RULE_ICONS: Record<GuestRuleKey, string> = {
  presence: 'guests',
  punctuality: 'clock',
  noPlusOnes: 'user-plus',
  celebrate: 'confetti',
  whiteIsForTheBride: 'wedding-dress',
  photos: 'camera-heart',
  dance: 'dance',
  smile: 'smile',
};

export interface DefaultGuestRule {
  text: string;
  icon: string;
}

/** The 8 rules of the "Manual do bom convidado", in their default order. */
export const DEFAULT_GUEST_RULES: readonly DefaultGuestRule[] = (
  Object.keys(GUEST_RULE_ICONS) as GuestRuleKey[]
).map((key) => ({ text: invitationDefaults.guestRules[key], icon: GUEST_RULE_ICONS[key] }));
