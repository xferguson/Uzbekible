// Screenshots of the D1 mockup at deviceScaleFactor 2.
// Run: node docs/design/mockups/screenshot.mjs  (needs Playwright + network for Google Fonts)
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// require() resolves a globally installed Playwright as well as a local one.
const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'screens');
mkdirSync(out, { recursive: true });
// The Artifact host wraps the page in a skeleton; do the same locally.
const body = readFileSync(join(here, 'D1-design-system.html'), 'utf8');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;

const browser = await chromium.launch();
async function open(width, height, scheme) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const shot = (page, sel, name) => page.locator(sel).screenshot({ path: join(out, `${name}.png`) });

const desk = await open(1280, 900, 'light');
for (const id of ['palette', 'contrast', 'type', 'motifs', 'tiles', 'motion', 'icons', 'decisions']) await shot(desk, `#${id}`, `D1-${id}`);
await shot(desk, 'header.mast', 'D1-masthead');
await desk.close();

// Home screens at native size.
const wide = await open(1400, 900, 'light');
await wide.addStyleTag({ content: '.wrap{max-width:none!important}' });
await wide.evaluate(() => dispatchEvent(new Event('resize')));
for (const id of ['phone-light', 'phone-dark', 'desk-light', 'desk-dark']) await shot(wide, `#${id}`, `D1-home-${id}`);
await wide.close();

// The page itself on a phone, in the viewer's dark theme.
const phone = await open(390, 844, 'dark');
await phone.screenshot({ path: join(out, 'D1-page-phone-dark.png') });
await shot(phone, '#tiles', 'D1-tiles-phone-dark');
await phone.close();
await browser.close();
console.log('screens written to', out);
