/**
 * What the audit log records (`AuditLog.action`): every change an admin makes, in the admin area
 * and in a couple's dashboard. The keys are stored in the database (and match a CHECK constraint):
 * never rename or remove one without a data migration. Labels: pt-AO `admin.audit.actions`.
 */

/** Changes made in the admin area (and by `npm run admin:create`). */
export const ADMIN_AREA_ACTIONS = [
  'event.create',
  'event.activate',
  'event.deactivate',
  'event.guest-limit',
  'event.delete',
  'user.create',
  'user.update',
  'user.password-reset',
  'user.suspend',
  'user.unsuspend',
  'user.promote',
  'user.delete',
] as const;

/** An admin working in a couple's dashboard (their own events are not recorded). */
export const DASHBOARD_ACTIONS = [
  'event.edit',
  'event.invite-message',
  'media.upload',
  'media.delete',
  'media.reorder',
  'media.describe',
  'media.retry',
  'guest.create',
  'guest.update',
  'guest.delete',
  'guest.renew-link',
  'guest.mark-sent',
  'guest.answer',
  'guest.import',
  'guest.export',
] as const;

export const AUDIT_ACTIONS = [...ADMIN_AREA_ACTIONS, ...DASHBOARD_ACTIONS] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type DashboardAuditAction = (typeof DASHBOARD_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = ['event', 'user'] as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

export function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === 'string' && (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export function isAuditTargetType(value: unknown): value is AuditTargetType {
  return typeof value === 'string' && (AUDIT_TARGET_TYPES as readonly string[]).includes(value);
}
