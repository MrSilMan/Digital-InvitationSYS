// Runs the production build locally the same way the Docker image does: the standalone server
// with the observability preload (see scripts/preload.ts). Usage: `npm run build && npm start`.
import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const standalone = '.next/standalone';

if (!existsSync(`${standalone}/server.js`) || !existsSync('dist/preload.cjs')) {
  console.error('No production build found. Run `npm run build` first.');
  process.exit(1);
}

// The standalone output leaves static files out on purpose (the Docker image copies them in).
cpSync('.next/static', `${standalone}/.next/static`, { recursive: true });
if (existsSync('public')) cpSync('public', `${standalone}/public`, { recursive: true });

require('../dist/preload.cjs');
require(`../${standalone}/server.js`);
