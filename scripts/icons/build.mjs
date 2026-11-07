// Writes the PWA icon set into public/: SVG sources, PNG rasters and favicon.ico.
// Run: npm run icons:build   (needs Playwright's Chromium; Node strips the TypeScript types)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAVICON_ICO_SIZES, ICON_FILES, SVG_FILES, encodeIco, iconSvg } from './icons.ts';

// require() resolves a globally installed Playwright as well as a local one.
const { chromium } = createRequire(import.meta.url)('playwright');
const pub = join(dirname(fileURLToPath(import.meta.url)), '../../public');
const write = (file, data) => {
  mkdirSync(dirname(join(pub, file)), { recursive: true });
  writeFileSync(join(pub, file), data);
};

for (const { file, variant } of SVG_FILES) write(file, iconSvg(variant));

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(variant, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0">${iconSvg(variant, size)}</body></html>`,
  );
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
}

for (const { file, size, variant } of ICON_FILES) write(file, await render(variant, size));

const ico = [];
for (const size of FAVICON_ICO_SIZES) ico.push({ size, png: await render('favicon', size) });
write('favicon.ico', encodeIco(ico));

await browser.close();
console.log(`icons: ${SVG_FILES.length} SVG, ${ICON_FILES.length} PNG, favicon.ico`);
