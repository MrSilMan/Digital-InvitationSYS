import { z } from 'zod';

/**
 * Server environment, validated with Zod.
 *
 * - Validated once at startup (`assertServerEnv()` from `instrumentation.ts`, and the worker's entry
 *   point): the process exits with a readable list of problems instead of failing later.
 * - Not validated during `next build`, so one Docker image can be promoted between environments.
 * - Read it through `getServerEnv()`, never `process.env` directly (except the few low-level modules
 *   documented in CLAUDE.md).
 */

const APP_ENVS = ['development', 'test', 'staging', 'production'] as const;
const LOG_LEVELS = ['error', 'warn', 'info', 'http', 'debug'] as const;

const required = (what: string) => ({
  error: (issue: { input?: unknown }) =>
    issue.input === undefined ? 'is required' : `must be ${what}`,
});

const sampleRate = z.coerce
  .number({ error: 'must be a number between 0 and 1' })
  .min(0, 'must be between 0 and 1')
  .max(1, 'must be between 0 and 1');

const serverEnvShape = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(APP_ENVS).default('development'),
  APP_URL: z
    .url({ protocol: /^https?$/, ...required('an http(s) URL') })
    .default('http://localhost:3000'),
  APP_RELEASE: z.string().trim().min(1).max(64).default('dev'),
  SERVICE_NAME: z.enum(['web', 'worker']).default('web'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/, ...required('a postgresql:// URL') }),
  REDIS_URL: z.url({ protocol: /^rediss?$/, ...required('a redis:// URL') }),

  /** Signs session cookies (Better Auth). Changing it signs everyone out. */
  BETTER_AUTH_SECRET: z
    .string(required('a random string of at least 32 characters'))
    .min(32, 'must be at least 32 characters (e.g. `openssl rand -base64 32`)'),

  // Object storage (S3 API: MinIO locally, Cloudflare R2 or AWS S3 in production).
  /** Where the app and the worker reach the storage. Unset: AWS S3 in S3_REGION. */
  S3_ENDPOINT: z.url({ protocol: /^https?$/, ...required('an http(s) URL') }).optional(),
  /** Where browsers upload (presigned URLs), when it differs from S3_ENDPOINT (Docker). */
  S3_PUBLIC_ENDPOINT: z.url({ protocol: /^https?$/, ...required('an http(s) URL') }).optional(),
  S3_REGION: z.string().trim().min(1).default('us-east-1'),
  S3_BUCKET: z.string(required('a bucket name')).trim().min(3).max(63),
  S3_ACCESS_KEY_ID: z.string(required('an access key ID')).trim().min(1),
  S3_SECRET_ACCESS_KEY: z.string(required('a secret access key')).trim().min(1),
  /** MinIO needs path-style URLs (http://host:9000/bucket/key). */
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'], { error: 'must be true or false' })
    .default('false')
    .transform((value) => value === 'true'),

  SENTRY_DSN: z.url(required('a valid Sentry DSN URL')).optional(),
  SENTRY_TRACES_SAMPLE_RATE: sampleRate.default(0.1),

  // Public values are inlined into the browser bundle at build time; validated here as well.
  NEXT_PUBLIC_SENTRY_DSN: z.url(required('a valid Sentry DSN URL')).optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(APP_ENVS).default('development'),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: sampleRate.default(0.1),
});

const serverEnvSchema = serverEnvShape.refine(
  (env) =>
    !(env.APP_ENV === 'staging' || env.APP_ENV === 'production') ||
    env.APP_URL.startsWith('https://'),
  { path: ['APP_URL'], message: 'must use https:// on staging and production' },
);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

type RawEnv = Readonly<Record<string, string | undefined>>;

/** Only the variables we know about; empty strings count as "not set". */
function pickKnownVariables(raw: RawEnv): Record<string, string | undefined> {
  const picked: Record<string, string | undefined> = {};
  for (const key of Object.keys(serverEnvShape.shape)) {
    const value = raw[key]?.trim();
    picked[key] = value === '' ? undefined : value;
  }
  return picked;
}

export function parseServerEnv(raw: RawEnv = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(pickKnownVariables(raw));
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  return result.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv();
  return cached;
}

/** Fail fast at startup: prints every problem and exits (the logger may not be usable yet). */
export function assertServerEnv(): void {
  try {
    getServerEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(`\n${error.message}\n\nSee .env.example for every supported variable.\n`);
      process.exit(1);
    }
    throw error;
  }
}
