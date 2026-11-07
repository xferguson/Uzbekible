// Screenshots of the D3 icon set on mock phone home screens (light + dark) and under common masks,
// at deviceScaleFactor 2. Run after `npm run icons:build`:  node docs/design/icon/screenshot.mjs
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../../public');
const out = join(here, 'screens');
mkdirSync(out, { recursive: true });

const dataUrl = (file) =>
  `data:image/png;base64,${readFileSync(join(pub, file)).toString('base64')}`;
const maskable = dataUrl('icons/icon-maskable-192.png');
const apple = dataUrl('icons/apple-touch-icon.png');
const any = dataUrl('icons/icon-192.png');

// Neighbouring apps are neutral placeholder squares so the Uzbekible icon is judged in context.
const DUMMY = ['#E4572E', '#29335C', '#F3A712', '#669BBC', '#8E7DBE', '#2A9D8F', '#E76F51', '#264653'];
const appGrid = (src, mask, label) => {
  const cells = Array.from({ length: 12 }, (_, i) =>
    i === 5
      ? `<div class="app"><img src="${src}" style="${mask}" alt=""><span>${label}</span></div>`
      : `<div class="app"><i style="${mask};background:${DUMMY[i % DUMMY.length]}"></i><span>App</span></div>`,
  ).join('');
  return `<div class="grid">${cells}</div>`;
};
const css = (dark) => `
  body{margin:0;font:12px system-ui,sans-serif}
  .screen{width:390px;height:844px;box-sizing:border-box;padding:72px 22px;color:${dark ? '#fff' : '#111'};
    background:${dark ? 'radial-gradient(circle at 30% 20%,#23345e,#05070d 70%)' : 'radial-gradient(circle at 30% 20%,#fef6e4,#cfe3ea 70%)'}}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);row-gap:26px;justify-items:center}
  .app{display:grid;gap:6px;justify-items:center}
  .app img,.app i{display:block;width:62px;height:62px}
  .app span{font-size:11px;text-shadow:${dark ? '0 1px 2px #000' : 'none'}}
  h2{font-size:13px;font-weight:600;margin:0 0 18px;opacity:.7}`;

const screens = [
  ['android-light', false, 'Android (circle mask)', maskable, 'border-radius:50%'],
  ['android-dark', true, 'Android (circle mask)', maskable, 'border-radius:50%'],
  ['ios-light', false, 'iOS (apple-touch-icon)', apple, 'border-radius:22.37%'],
  ['ios-dark', true, 'iOS (apple-touch-icon)', apple, 'border-radius:22.37%'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [name, dark, title, src, mask] of screens) {
  await page.setContent(
    `<!doctype html><html><head><style>${css(dark)}</style></head><body><div class="screen"><h2>${title}</h2>${appGrid(src, mask, 'Uzbekible')}</div></body></html>`,
  );
  await page.screenshot({ path: join(out, `D3-home-${name}.png`) });
}

// The full set side by side, plus the maskable icon under each common mask shape.
const sizes = [512, 192, 144, 96, 72, 48];
const masks = [
  ['full bleed', '0'],
  ['circle', '50%'],
  ['squircle', '30%'],
  ['rounded square', '12%'],
];
await page.setViewportSize({ width: 1180, height: 820 });
await page.setContent(`<!doctype html><html><head><style>
  body{margin:0;padding:24px;font:12px system-ui,sans-serif;background:#fff;color:#13213F}
  .row{display:flex;gap:24px;align-items:flex-end;margin-bottom:32px} figure{margin:0;display:grid;gap:6px}
  img{display:block;box-shadow:0 0 0 1px #0002} .safe{position:relative} .safe svg{position:absolute;inset:0}
  h3{margin:0 0 12px;font-size:13px}</style></head><body>
  <h3>purpose: any</h3><div class="row">${sizes.map((s) => `<figure><img src="${dataUrl(`icons/icon-${s}.png`)}" width="${Math.min(s, 256)}"><figcaption>${s} px</figcaption></figure>`).join('')}
    <figure><img src="${dataUrl('favicon.ico')}" width="32" style="image-rendering:pixelated"><figcaption>favicon</figcaption></figure></div>
  <h3>purpose: maskable</h3><div class="row">
    <figure class="safe"><img src="${dataUrl('icons/icon-maskable-512.png')}" width="192"><svg viewBox="0 0 512 512" width="192" height="192"><circle cx="256" cy="256" r="204.8" fill="none" stroke="#B5652B" stroke-width="4" stroke-dasharray="14 10"/></svg><figcaption>safe zone (r = 40%)</figcaption></figure>
    ${masks.map(([n, r]) => `<figure><img src="${maskable}" width="192" style="border-radius:${r}"><figcaption>${n}</figcaption></figure>`).join('')}
    <figure><img src="${any}" width="96" style="border-radius:22%"><figcaption>any, rounded</figcaption></figure></div>
</body></html>`);
await page.screenshot({ path: join(out, 'D3-icon-set.png'), fullPage: true });
await browser.close();
console.log('screens written to', out);
