/**
 * Playwright implementation of the shots `Driver`: game-agnostic moves through the shell. Time is Playwright's fake
 * clock (Date, performance.now, timers, rAF), paused once the app is open, so countdowns, flashes and hints hold
 * still for the screenshot and the elapsed time a state wants is exact.
 */
import type { Page } from '@playwright/test';
import type { Driver, OpenOptions } from './types.ts';

export const SETTINGS_KEY = 'uzbekible:v1:settings';
export const progressKey = (gameId: string) => `uzbekible:v1:progress:${gameId}`;
const DEFAULT_SETTINGS = { languages: ['tr', 'ru', 'fa', 'ar'], script: 'uz-Latn', theme: 'system' };
/** Fixed start time, so dates and seeds derived from the clock repeat between runs. */
const T0 = Date.UTC(2026, 0, 1);
const COUNTDOWN_MS = 3_000;
/** The shell re-renders every 100 ms while time moves (GameShell TICK_MS). */
const TICK_MS = 100;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class StateCheckError extends Error {}

/** `appUrl` is the app root, e.g. `http://localhost:4174/Uzbekible/`. */
export function createDriver(page: Page, appUrl: string): Driver {
  const d: Driver = {
    page,
    async open(opts: OpenOptions = {}) {
      await page.clock.install({ time: T0 });
      await page.goto(`${appUrl}?seed=1&clock=fake`);
      const entries: [string, unknown][] = [
        [SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...opts.settings }],
        ...Object.entries(opts.progress ?? {}).map(
          ([id, p]) => [progressKey(id), { best: {}, ...p }] as [string, unknown],
        ),
      ];
      await page.evaluate((kv) => {
        localStorage.clear();
        for (const [k, v] of kv) localStorage.setItem(k, JSON.stringify(v));
      }, entries);
      await page.reload();
      // The game picker fills in once the content pack has loaded.
      await page.locator('nav button').nth(1).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const now = await page.evaluate(() => Date.now());
      await page.clock.pauseAt(now + 1_000);
    },
    async advance(ms) {
      await page.clock.runFor(ms);
    },
    async tap(name) {
      await page.getByRole('button', { name, exact: typeof name === 'string' }).click();
    },
    async openGame(title) {
      await d.tap(title);
      await page.locator('section[aria-label]').first().waitFor();
    },
    async advanceUntil(done, { stepMs = TICK_MS, maxMs = 10_000 } = {}) {
      // Small steps, so a timer the app registers after a step (React effects run after paint) still fires.
      for (let t = 0; !(await done()); t += stepMs) {
        if (t >= maxMs) throw new StateCheckError(`condition not met within ${maxMs} ms of app time`);
        await page.clock.runFor(stepMs);
      }
    },
    async startLevel(n, opts = {}) {
      await page.getByRole('button', { name: new RegExp(`^${escape(String(n))}-`) }).click();
      await page.getByRole('status').first().waitFor();
      if (opts.countdownMs !== undefined) {
        for (let t = 0; t < opts.countdownMs; t += TICK_MS) await d.advance(TICK_MS);
      } else {
        // Play has started once the shell HUD (with its pause button) replaces the countdown.
        const pause = page.getByRole('button', { name: /^(Pauza|Пауза)$/ });
        await d.advanceUntil(() => pause.isVisible(), { maxMs: COUNTDOWN_MS * 2 });
      }
      await page.evaluate(() => document.fonts.ready);
    },
    check(ok, message) {
      if (!ok) throw new StateCheckError(message);
    },
  };
  return d;
}
