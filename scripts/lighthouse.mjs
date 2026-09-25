// Lighthouse's mobile profile (simulated slow 4G, 4x slower CPU) on the key pages, several runs
// each; prints the medians. Scores move between runs, so compare medians, never single runs.
//
//   npm run build && npm start               (in another terminal; demo data: npm run db:seed)
//   npm run lighthouse                        every key page, 3 runs each, http://localhost:3000
//   npm run lighthouse -- --base=http://localhost:3100 --runs=5 --page=/entrar --min=90
//
// --min=<score> exits with an error when a page's median performance or accessibility is lower.
// Git Bash rewrites arguments that look like paths (/c/... becomes C:/...): prefix the command with
// MSYS_NO_PATHCONV=1 when passing --page.
// Lighthouse runs through npx (pinned below, not a dependency) with the Chrome installed on the
// machine. Reports land in .lighthouse/ (open the .html files for the details).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const LIGHTHOUSE = 'lighthouse@13.5.0';
const OUT_DIR = '.lighthouse';

/** The demo event's guest links (see the seed) and the login page. */
const KEY_PAGES = {
  'Praia Rosa': '/c/braulio-e-nanda/demo-familia-silva-001',
  Champanhe: '/c/braulio-e-nanda-champanhe/demo-champanhe-silva-01',
  'Save the Date': '/c/braulio-e-nanda-save-the-date/demo-std-familia-silva1',
  Login: '/entrar',
};

const { values } = parseArgs({
  options: {
    base: { type: 'string', default: 'http://localhost:3000' },
    runs: { type: 'string', default: '3' },
    page: { type: 'string', multiple: true },
    min: { type: 'string' },
  },
  strict: true,
});
const base = values.base.replace(/\/$/, '');
const runs = Math.max(1, Number.parseInt(values.runs, 10) || 3);
const min = values.min === undefined ? undefined : Number(values.min);
const pages = values.page?.length
  ? Object.fromEntries(values.page.map((pagePath) => [pagePath, pagePath]))
  : KEY_PAGES;

const health = await fetch(`${base}/api/health`).catch(() => null);
if (!health?.ok) {
  console.error(`No app at ${base}. Start one first: npm run build && npm start`);
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const median = (numbers) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** One Lighthouse run; null when it produced no report. */
function audit(url, file) {
  const args = [
    '--yes',
    LIGHTHOUSE,
    url,
    '--quiet',
    '--output=json',
    '--output=html',
    `--output-path=${file}`,
    '--only-categories=performance,accessibility,best-practices',
    '--chrome-flags=--headless=new',
  ];
  // Windows starts npx.cmd only through a shell, as one command line (no argument has spaces).
  if (process.platform === 'win32') {
    spawnSync(['npx', ...args].join(' '), { stdio: 'ignore', shell: true });
  } else {
    spawnSync('npx', args, { stdio: 'ignore' });
  }
  // The exit code is unreliable on Windows (Chrome's temporary folder), the report is not.
  const json = `${file}.report.json`;
  if (!existsSync(json)) return null;
  const report = JSON.parse(readFileSync(json, 'utf8'));
  if (report.runtimeError) return null;
  const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
  const metric = (id) => report.audits[id]?.numericValue ?? Number.NaN;
  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    fcp: metric('first-contentful-paint'),
    lcp: metric('largest-contentful-paint'),
    tbt: metric('total-blocking-time'),
    cls: metric('cumulative-layout-shift'),
    bytes: metric('total-byte-weight'),
  };
}

const rows = [];
for (const [name, pagePath] of Object.entries(pages)) {
  const url = `${base}${pagePath}`;
  // Warm the server's caches first: a cold start is not what guests get.
  await fetch(url).catch(() => null);
  const results = [];
  for (let run = 1; run <= runs; run += 1) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const result = audit(url, path.join(OUT_DIR, `${slug}-${run}`));
    if (result) results.push(result);
    process.stdout.write('.');
  }
  if (results.length === 0) {
    rows.push({ name, failed: true });
    continue;
  }
  const pick = (key) => median(results.map((result) => result[key]));
  rows.push({
    name,
    performance: pick('performance'),
    accessibility: pick('accessibility'),
    bestPractices: pick('bestPractices'),
    fcp: pick('fcp'),
    lcp: pick('lcp'),
    tbt: pick('tbt'),
    cls: pick('cls'),
    bytes: pick('bytes'),
    runs: results.map((result) => result.performance),
  });
}
process.stdout.write('\n\n');

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const header = ['Page', 'Perf', 'A11y', 'BP', 'FCP', 'LCP', 'TBT', 'CLS', 'Weight', 'Perf runs'];
const lines = rows.map((row) =>
  row.failed
    ? [row.name, 'no report (is the page reachable?)']
    : [
        row.name,
        String(row.performance),
        String(row.accessibility),
        String(row.bestPractices),
        seconds(row.fcp),
        seconds(row.lcp),
        `${Math.round(row.tbt)} ms`,
        row.cls.toFixed(3),
        `${Math.round(row.bytes / 1024)} KB`,
        row.runs.join(' '),
      ],
);
const widths = header.map((title, column) =>
  Math.max(title.length, ...lines.map((line) => (line[column] ?? '').length)),
);
for (const line of [header, ...lines]) {
  console.log(line.map((cell, column) => cell.padEnd(widths[column])).join('  '));
}
console.log(`\nMedians of ${runs} run(s). Reports: ${OUT_DIR}/`);

if (min !== undefined) {
  const below = rows.filter(
    (row) => row.failed || row.performance < min || row.accessibility < min,
  );
  if (below.length > 0) {
    console.error(`\nBelow ${min}: ${below.map((row) => row.name).join(', ')}`);
    process.exit(1);
  }
}
