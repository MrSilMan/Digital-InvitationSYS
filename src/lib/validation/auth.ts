import { z } from 'zod';

import { auth } from '@/i18n/pt-AO';

const { errors } = auth.login;

/** The login form (browser and Server Action). E-mail addresses are compared in lower case. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, errors.emailInvalid)
    .pipe(z.email(errors.emailInvalid)),
  password: z.string().min(1, errors.passwordRequired).max(128, errors.passwordRequired),
});

export type LoginInput = z.input<typeof loginSchema>;
