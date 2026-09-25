/**
 * The worker's first import: names the service and loads the .env files the way Next.js does,
 * before any other module reads the environment (the logger reads it when imported).
 */
import { loadEnvConfig } from '@next/env';

const env = process.env as Record<string, string | undefined>;
// The production image sets NODE_ENV=production; a worker started from a checkout is development.
env.NODE_ENV ??= 'development';
env.SERVICE_NAME = 'worker';
loadEnvConfig(process.cwd(), env.NODE_ENV === 'development');
