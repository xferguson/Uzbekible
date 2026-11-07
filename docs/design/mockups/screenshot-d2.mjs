// Screenshots of the D2 Juft mockup at deviceScaleFactor 2.
// Run: node docs/design/mockups/screenshot-d2.mjs  (needs Playwright + network for Google Fonts)
// Each device frame is captured at native size (390×844 phone, 1280×800 desktop), plus the page sections.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'screens');
mkdirSync(out, { recursive: true });
// The Artifact host wraps the page in a skeleton; do the same locally.
const body = readFileSync(join(here, 'D2-juft-screens.html'), 'utf8');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;

const browser = await chromium.launch();
async function open(width, height, scheme) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Device frames at native size: widen the page so no frame is scaled down.
const wide = await open(2800, 1000, 'light');
await wide.addStyleTag({ content: '.wrap{max-width:none!important}.frames{grid-template-columns:repeat(auto-fill,390px)!important}.frames.desk-frames{grid-template-columns:repeat(auto-fill,1280px)!important}' });
await wide.evaluate(() => dispatchEvent(new Event('resize')));
const frames = await wide.$$eval('.group', (gs) => gs.map((g) => ({ id: g.id, caps: [...g.querySelectorAll('.frame-cap')].map((c) => c.querySelector('b').textContent + ' ' + c.querySelector('span').textContent) })));
let n = 0;
for (const { id, caps } of frames) {
  const devices = wide.locator(`#${id} .device`);
  for (let i = 0; i < caps.length; i++) {
    await devices.nth(i).screenshot({ path: join(out, `D2-${id.replace(/^g-/, 'phone-').replace(/^d-/, 'desk-')}-${slug(caps[i])}.png`) });
    n++;
  }
}
await wide.close();

// Page sections on desktop.
const desk = await open(1280, 900, 'light');
for (const id of ['flow', 'samples', 'story', 'try', 'timings', 'decisions']) await desk.locator(`#${id}`).screenshot({ path: join(out, `D2-section-${id}.png`) });
await desk.close();

// The page itself on a phone, in the viewer's dark theme.
const phone = await open(390, 844, 'dark');
await phone.screenshot({ path: join(out, 'D2-page-phone-dark.png') });
await phone.close();
await browser.close();
console.log(`${n} frames + sections written to`, out);
