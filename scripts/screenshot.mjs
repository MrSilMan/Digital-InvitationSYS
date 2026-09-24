// Visual check helper: screenshots every element matching a selector (or the whole page) with
// Playwright's Chromium, after web fonts have loaded.
//
//   node scripts/screenshot.mjs <url> <outDir> [--selector="main section"] [--width=390]
//        [--height=844] [--scale=2] [--full]
//
// Example (phone size, each invitation section separately):
//   node scripts/screenshot.mjs http://localhost:3000/design .screenshots --selector="[data-theme] > section"
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';

const [url, outDir, ...flags] = process.argv.slice(2);
if (!url || !outDir) {
  console.error(
    'Usage: node scripts/screenshot.mjs <url> <outDir> [--selector=…] [--width=390] [--height=844] [--scale=2] [--full]',
  );
  process.exit(1);
}
const option = (name, fallback) => {
  const flag = flags.find((f) => f.startsWith(`--${name}=`));
  return flag ? flag.slice(name.length + 3) : fallback;
};

const width = Number(option('width', '390'));
const height = Number(option('height', '844'));
const scale = Number(option('scale', '2'));
const selector = option('selector', '');

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  if (selector) {
    const elements = page.locator(selector);
    const count = await elements.count();
    for (let index = 0; index < count; index += 1) {
      const file = path.join(outDir, `${String(index + 1).padStart(2, '0')}.png`);
      await elements.nth(index).screenshot({ path: file });
      console.log(file);
    }
  } else {
    const file = path.join(outDir, 'page.png');
    await page.screenshot({ path: file, fullPage: flags.includes('--full') });
    console.log(file);
  }
} finally {
  await browser.close();
}
