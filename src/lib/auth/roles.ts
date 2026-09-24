/** Account roles (Better Auth admin plugin): couples edit their own events, admins everything. */
export const USER_ROLES = ['couple', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** A stored role as one of ours; anything unexpected gets the least privileges. */
export function toUserRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'couple';
}
