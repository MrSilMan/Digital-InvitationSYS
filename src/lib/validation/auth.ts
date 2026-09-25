import { z } from 'zod';

import { account, auth } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';

const { errors } = auth.login;

/** New passwords (Better Auth enforces the same limits: src/server/auth/auth.ts). */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/** An e-mail address, compared and stored in lower case. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, errors.emailInvalid)
  .pipe(z.email(errors.emailInvalid));

/** The login form (browser and Server Action). */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, errors.passwordRequired)
    .max(PASSWORD_MAX_LENGTH, errors.passwordRequired),
});

export type LoginInput = z.input<typeof loginSchema>;

const v = account.validation;

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, fillTemplate(v.tooShort, { min: String(PASSWORD_MIN_LENGTH) }))
  .max(PASSWORD_MAX_LENGTH, fillTemplate(v.tooLong, { max: String(PASSWORD_MAX_LENGTH) }));

/** "A minha conta": the current password, and the new one typed twice. */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, v.currentRequired)
      .max(PASSWORD_MAX_LENGTH, v.currentRequired),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.confirmPassword !== values.newPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: v.mismatch });
    }
    if (values.newPassword === values.currentPassword) {
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: v.sameAsCurrent });
    }
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
