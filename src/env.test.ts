import { describe, expect, it } from 'vitest';

import { EnvValidationError, parseServerEnv } from '@/env';

const minimal = {
  DATABASE_URL: 'postgresql://convites:convites@localhost:5432/convites',
  REDIS_URL: 'redis://localhost:6379',
};

function problemsOf(raw: Record<string, string | undefined>): readonly string[] {
  try {
    parseServerEnv(raw);
  } catch (error) {
    if (error instanceof EnvValidationError) return error.problems;
    throw error;
  }
  throw new Error('expected the environment to be invalid');
}

describe('parseServerEnv', () => {
  it('accepts the minimal configuration and applies defaults', () => {
    const env = parseServerEnv(minimal);

    expect(env).toMatchObject({
      APP_ENV: 'development',
      APP_URL: 'http://localhost:3000',
      APP_RELEASE: 'dev',
      SERVICE_NAME: 'web',
      LOG_LEVEL: 'info',
      SENTRY_TRACES_SAMPLE_RATE: 0.1,
    });
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it('treats empty strings as unset', () => {
    const env = parseServerEnv({ ...minimal, SENTRY_DSN: '', LOG_LEVEL: '  ' });
    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('coerces and bounds the Sentry sample rates', () => {
    expect(parseServerEnv({ ...minimal, SENTRY_TRACES_SAMPLE_RATE: '0.25' })).toMatchObject({
      SENTRY_TRACES_SAMPLE_RATE: 0.25,
    });
    expect(problemsOf({ ...minimal, SENTRY_TRACES_SAMPLE_RATE: '2' })).toEqual([
      'SENTRY_TRACES_SAMPLE_RATE: must be between 0 and 1',
    ]);
  });

  it('lists every missing or invalid variable in one error', () => {
    const problems = problemsOf({ REDIS_URL: 'http://localhost:6379', LOG_LEVEL: 'verbose' });

    expect(problems).toHaveLength(3);
    expect(problems).toContain('DATABASE_URL: is required');
    expect(problems).toContain('REDIS_URL: must be a redis:// URL');
    expect(problems.some((problem) => problem.startsWith('LOG_LEVEL:'))).toBe(true);
  });

  it('requires https for APP_URL on staging and production', () => {
    expect(
      problemsOf({ ...minimal, APP_ENV: 'production', APP_URL: 'http://convites.ao' }),
    ).toEqual(['APP_URL: must use https:// on staging and production']);
    expect(
      parseServerEnv({ ...minimal, APP_ENV: 'staging', APP_URL: 'https://staging.convites.ao' })
        .APP_URL,
    ).toBe('https://staging.convites.ao');
  });

  it('ignores unrelated variables', () => {
    const env = parseServerEnv({ ...minimal, SOMETHING_ELSE: 'x' }) as Record<string, unknown>;
    expect(env).not.toHaveProperty('SOMETHING_ELSE');
  });
});
