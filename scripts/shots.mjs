/**
 * `npm run shots` (V1): drives the real app into every screen state in `e2e/states.ts` at phone and desktop sizes,
 * light and dark, and writes `shots/<state>-<width>-<scheme>.png` plus `shots/compare.html` (app left, approved
 * mockup frame right, from `docs/design/frames.json`). Cloud-session tool: never run in CI.
 *
 *   npm run shots                          all states
 *   npm run shots -- --states map,results  ids or id prefixes (map → map-early, map-late)
 *   npm run shots -- --games juft          one game's states
 *   npm run shots -- --url http://localhost:5173/Uzbekible/   use a running e2e/dev server instead of building
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VIEWPORTS = [
  { width: 360, height: 780, kind: 'phone' },
  { width: 390, height: 844, kind: 'phone' },
  { width: 1280, height: 800, kind: 'desktop' },
];
export const SCHEMES = ['light', 'dark'];
const PORT = 4174;
const CONCURRENCY = 4;

export function parseArgs(argv) {
  const out = { states: null, games: null, url: null };
  const list = (v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s, 2);
    const value = () => inline ?? argv[++i] ?? '';
    if (flag === '--states') out.states = list(value());
    else if (flag === '--games') out.games = list(value());
    else if (flag === '--url') out.url = value();
    else throw new Error(`shots: unknown argument ${argv[i]} (use --states, --games, --url)`);
  }
  return out;
}

/** States kept by the filters: `--states` matches an id or an id prefix (`map` → `map-early`). */
export function selectStates(states, { states: ids, games }) {
  return states.filter(
    (s) =>
      (!ids || ids.some((f) => s.id === f || s.id.startsWith(`${f}-`))) &&
      (!games || games.includes(s.game ?? 'shell')),
  );
}

export const shotName = (id, width, scheme) => `${id}-${width}-${scheme}.png`;

const kindOf = (width) => VIEWPORTS.find((v) => v.width === width)?.kind ?? 'phone';

/** Frame files (repo-relative) for one state at one size and scheme; `{scheme}` is filled in. */
export function framesFor(frames, id, width, scheme) {
  const entry = frames.states?.[id];
  return (entry?.[kindOf(width)] ?? []).map((f) => f.replaceAll('{scheme}', scheme));
}

/** Problems with the state → frame mapping; empty when every state is mapped and every frame file exists. */
export function checkFrames(states, frames, exists) {
  const ids = new Set(states.map((s) => s.id));
  const entries = frames.states ?? {};
  const problems = [];
  for (const id of ids) if (!(id in entries)) problems.push(`${id}: no entry in frames.json`);
  for (const id of Object.keys(entries))
    if (!ids.has(id)) problems.push(`${id}: entry in frames.json but no such state`);
  for (const [id, entry] of Object.entries(entries)) {
    for (const kind of ['phone', 'desktop']) {
      if (!Array.isArray(entry[kind]))
        problems.push(`${id}: "${kind}" must be a list (empty = no frame yet)`);
      for (const f of entry[kind] ?? [])
        for (const scheme of SCHEMES) {
          const file = f.replaceAll('{scheme}', scheme);
          if (!exists(file)) problems.push(`${id}: frame file ${file} does not exist`);
        }
    }
  }
  return problems;
}

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

/**
 * The review page. `rows`: { state: {id, title}, width, scheme, shot (file name or null), frames (page-relative
 * paths), error? }. Self-contained apart from the images beside it, so `shots/` publishes as one Artifact.
 */
export function compareHtml(rows) {
  const missing = rows.filter((r) => r.frames.length === 0).length;
  const failed = rows.filter((r) => r.error).length;
  const cell = (r) => {
    const app = r.error
      ? `<div class="flag err">State failed: ${esc(r.error)}</div>`
      : `<img loading="lazy" src="${esc(r.shot)}" alt="App: ${esc(r.state.id)} ${r.width} ${r.scheme}">`;
    const mock = r.frames.length
      ? r.frames
          .map((f) => `<img loading="lazy" src="${esc(f)}" alt="Mockup: ${esc(basename(f))}">`)
          .join('')
      : `<div class="flag">No mockup frame for this state at this size</div>`;
    return `<article class="row${r.frames.length ? '' : ' missing'}${r.error ? ' failed' : ''}" data-scheme="${r.scheme}" data-width="${r.width}">
  <h3>${esc(r.state.id)} · ${r.width}px · ${r.scheme}</h3>
  <div class="pair"><figure><figcaption>App</figcaption>${app}</figure><figure><figcaption>Mockup</figcaption>${mock}</figure></div>
</article>`;
  };
  const byState = new Map();
  for (const r of rows) byState.set(r.state.id, [...(byState.get(r.state.id) ?? []), r]);
  const sections = [...byState.values()]
    .map(
      (
        rs,
      ) => `<section id="${esc(rs[0].state.id)}"><h2>${esc(rs[0].state.id)}</h2><p>${esc(rs[0].state.title)}</p>
${rs.map(cell).join('\n')}</section>`,
    )
    .join('\n');
  const toc = [...byState.keys()].map((id) => `<a href="#${esc(id)}">${esc(id)}</a>`).join(' ');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Uzbekible app vs mockups</title>
<style>
:root{--bg:#f7f5ef;--fg:#1b2333;--muted:#5b6475;--card:#fff;--line:#d9d4c7;--warn:#8a5a00;--warnbg:#fff3d6;--err:#a3231a;--errbg:#fde4e1;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#11161f;--fg:#e8e6df;--muted:#a3a9b5;--card:#1a2130;--line:#2c3547;--warn:#ffd37a;--warnbg:#3a2d10;--err:#ffb4ab;--errbg:#47201c;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
header,main{max-width:1500px;margin:0 auto;padding:16px}
nav{display:flex;flex-wrap:wrap;gap:8px 12px}a{color:inherit}
.filters{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}
.row{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;margin:12px 0}
.row h3{margin:0 0 8px;font-size:14px;color:var(--muted)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
figure{margin:0;min-width:0}figcaption{font-size:12px;color:var(--muted);margin-bottom:4px}
img{display:block;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--line);border-radius:6px;margin-bottom:6px}
.flag{padding:12px;border-radius:6px;background:var(--warnbg);color:var(--warn);font-weight:600}
.flag.err{background:var(--errbg);color:var(--err)}
.summary .bad{color:var(--err);font-weight:600}
body.only-missing .row:not(.missing),body.hide-dark .row[data-scheme="dark"],body.hide-light .row[data-scheme="light"]{display:none}
@media (max-width:640px){.pair{grid-template-columns:1fr}}
</style></head><body>
<header><h1>App vs mockups</h1>
<p class="summary">${rows.length} shots · <span class="${missing ? 'bad' : ''}">${missing} missing frame${missing === 1 ? '' : 's'}</span> · <span class="${failed ? 'bad' : ''}">${failed} failed state${failed === 1 ? '' : 's'}</span></p>
<div class="filters"><label><input type="checkbox" data-class="only-missing"> Only missing frames</label>
<label><input type="checkbox" data-class="hide-dark"> Hide dark</label>
<label><input type="checkbox" data-class="hide-light"> Hide light</label></div>
<nav>${toc}</nav></header>
<main>${sections}</main>
<script>for(const c of document.querySelectorAll('[data-class]'))c.addEventListener('change',()=>document.body.classList.toggle(c.dataset.class,c.checked))</script>
</body></html>
`;
}

/** Runs `fn` over `items` with at most `n` in flight. */
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

async function waitFor(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`shots: ${url} did not come up`);
}

/** Builds the e2e bundle into shots/.app and serves it; returns the app URL and a stop function. */
async function serve(root) {
  const outDir = join(root, 'shots/.app');
  const vite = join(root, 'node_modules/vite/bin/vite.js');
  const build = spawnSync(
    process.execPath,
    [vite, 'build', '--mode', 'e2e', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'],
    {
      cwd: root,
      stdio: 'inherit',
    },
  );
  if (build.status !== 0) throw new Error('shots: build failed');
  const server = spawn(
    process.execPath,
    [vite, 'preview', '--outDir', outDir, '--port', String(PORT), '--strictPort'],
    {
      cwd: root,
      stdio: 'ignore',
    },
  );
  const url = `http://localhost:${PORT}/Uzbekible/`;
  await waitFor(url, 30_000);
  return { url, stop: () => server.kill() };
}

async function main() {
  const started = Date.now();
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const args = parseArgs(process.argv.slice(2));
  const { STATES } = await import('../e2e/states.ts');
  const { createDriver } = await import('../e2e/shots/driver.ts');
  const { chromium } = await import('@playwright/test');
  const frames = JSON.parse(readFileSync(join(root, 'docs/design/frames.json'), 'utf8'));

  const states = selectStates(STATES, args);
  if (!states.length)
    throw new Error(`shots: no state matches (ids: ${STATES.map((s) => s.id).join(', ')})`);
  const problems = checkFrames(STATES, frames, (p) => existsSync(join(root, p)));
  for (const p of problems) console.warn(`frames.json: ${p}`);

  const out = join(root, 'shots');
  mkdirSync(join(out, 'frames'), { recursive: true });
  const { url, stop } = args.url ? { url: args.url, stop: () => {} } : await serve(root);
  const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
  const browser = await chromium.launch({ executablePath });

  const jobs = VIEWPORTS.flatMap((v) =>
    SCHEMES.flatMap((scheme) => states.map((state) => ({ v, scheme, state }))),
  );
  const rows = [];
  try {
    await pool(jobs, CONCURRENCY, async ({ v, scheme, state }) => {
      const phone = v.kind === 'phone';
      const context = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: 2,
        isMobile: phone,
        hasTouch: phone,
        colorScheme: scheme,
        reducedMotion: 'reduce',
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const shot = shotName(state.id, v.width, scheme);
      const row = { state, width: v.width, scheme, shot, frames: [] };
      try {
        await state.reach(createDriver(page, url));
        await page.screenshot({ path: join(out, shot), animations: 'disabled', caret: 'hide' });
      } catch (e) {
        row.shot = null;
        row.error = (e instanceof Error ? e.message : String(e))
          .split('\n')
          .filter((l) => l.trim() && !l.includes('Call log'))
          .slice(0, 2)
          .join(' · ');
        console.error(`✗ ${shot}: ${row.error}`);
      } finally {
        await context.close();
      }
      for (const f of framesFor(frames, state.id, v.width, scheme)) {
        copyFileSync(join(root, f), join(out, 'frames', basename(f)));
        row.frames.push(`frames/${basename(f)}`);
      }
      rows.push(row);
    });
  } finally {
    await browser.close();
    stop();
  }

  const order = (r) => [
    STATES.indexOf(r.state),
    VIEWPORTS.findIndex((v) => v.width === r.width),
    SCHEMES.indexOf(r.scheme),
  ];
  rows.sort((a, b) => {
    const [x, y] = [order(a), order(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
  writeFileSync(join(out, 'compare.html'), compareHtml(rows));
  rmSync(join(out, '.app'), { recursive: true, force: true });
  const failed = rows.filter((r) => r.error).length;
  const missing = rows.filter((r) => !r.frames.length).length;
  console.log(
    `shots: ${rows.length - failed}/${rows.length} shots, ${missing} without a mockup frame, ${((Date.now() - started) / 1000).toFixed(0)}s → shots/compare.html`,
  );
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
