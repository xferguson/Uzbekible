import { expect, test } from '@playwright/test';
import { createDriver } from './shots/driver.ts';
import { STATES } from './states.ts';
import { contrastViolations, layoutViolations } from './layout-checks.ts';

/**
 * V2: layout invariants over every state in `e2e/states.ts` (a new state is covered automatically). CI runs the cheap
 * subset (360 and 1280); `LAYOUT_FULL=1` (`npm run e2e:layout`) runs 320, 360, 390, 768 and 1280.
 */
const WIDTHS = process.env.LAYOUT_FULL ? [320, 360, 390, 768, 1280] : [360, 1280];
const SCHEMES = ['light', 'dark'] as const;
const heightFor = (w: number) => (w >= 768 ? 800 : 780);
const APP = '/Uzbekible/';

/**
 * Defects the suite found in the v1 UI that belong to the Juft fidelity tasks (V8 to V10). The task that fixes one removes its entry.
 */
const KNOWN: { owner: string; match: RegExp }[] = [
  { owner: 'V10', match: /^(small-target|default-font|default-button): <button> "Pauza"/ },
  { owner: 'V8', match: /^color-contrast: fieldset:nth-child\(\d\) > legend/ },
  { owner: 'V8', match: /^color-contrast: h3 / },
  { owner: 'V9', match: /^color-contrast: .*_cell_\w+.*data-stars/ },
  { owner: 'V9', match: /^color-contrast: .*_cell_\w+.*data-state/ },
  { owner: 'V10', match: /^color-contrast: (p|button\[data-stars|\._title_|\._combo_)/ },
];
const unknown = (found: string[]) => found.filter((v) => !KNOWN.some((e) => e.match.test(v)));

test.describe('checker', () => {
  test('flags an over-wide, clipped, unstyled page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.setContent(
      `<body style="margin:0"><div style="width:555px;height:20px;background:#ccc">wide</div>
       <p style="width:50px;overflow:hidden;white-space:nowrap">a very long clipped label</p>
       <button style="position:absolute;left:340px;top:0;width:60px;height:20px">Go</button>`,
    );
    const found = (await layoutViolations(page)).map((v) => v.split(':')[0]);
    for (const c of ['overflow', 'clipped', 'outside-viewport', 'small-target', 'default-button'])
      expect(found).toContain(c);
    expect(await layoutViolations(page)).toContain('overflow: scrollWidth 555 > 360');
  });

  test('passes a well-formed page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.setContent(
      `<body style="margin:0"><button style="width:100px;height:44px;font:16px sans-serif;background:#246;color:#fff">Go</button>`,
    );
    expect(await layoutViolations(page)).toEqual([]);
  });
});

for (const scheme of SCHEMES) {
  for (const width of WIDTHS) {
    test.describe(`${scheme} ${width}px`, () => {
      test.use({
        viewport: { width, height: heightFor(width) },
        colorScheme: scheme,
        reducedMotion: 'reduce',
        isMobile: width < 768,
        hasTouch: width < 768,
      });
      for (const state of STATES) {
        test(`${state.id}`, async ({ page, baseURL }) => {
          await state.reach(createDriver(page, new URL(APP, baseURL).toString()));
          expect.soft(unknown(await layoutViolations(page)), 'layout').toEqual([]);
          // axe schedules its own timers; the driver leaves the fake clock paused.
          await page.clock.resume();
          expect.soft(unknown(await contrastViolations(page)), 'color-contrast').toEqual([]);
        });
      }
    });
  }
}

// Folded in from PR #65: a behaviour check, not a layout one.
test.describe('way out', () => {
  test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

  test('stays visible on every screen, even over the pause overlay', async ({ page }) => {
    await page.goto(APP);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Juft' }).click();
    await expect(page.getByRole('button', { name: 'Orqaga' })).toBeVisible();
    await page.getByRole('button', { name: '1-daraja, joriy' }).click();
    await expect(page.getByTestId('col-left')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Pauza' }).click();
    await page.getByRole('button', { name: 'Bosh sahifa' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeVisible();
  });
});
