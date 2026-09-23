import { loadEnvConfig } from '@next/env';

// Same .env file precedence as `next start` (a no-op in Docker, where the container provides them).
loadEnvConfig(process.cwd(), false);
