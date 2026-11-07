export interface TestParams {
  seed: number | undefined;
  fakeClock: boolean;
}

declare global {
  interface Window {
    /** Present only in test builds (mode "e2e"/"test"/dev). */
    __uzbekibleTest?: TestParams;
  }
}

/** Parses `?seed=<int>&clock=fake` from a query string. */
export function parseTestParams(search: string): TestParams {
  const params = new URLSearchParams(search);
  const rawSeed = params.get('seed');
  const seed = rawSeed !== null && /^-?\d+$/.test(rawSeed) ? Number(rawSeed) : undefined;
  return { seed, fakeClock: params.get('clock') === 'fake' };
}

/** Exposes test params on `window.__uzbekibleTest`. No-op unless `enabled`. */
export function installTestHooks(win: Window, search: string, enabled: boolean): void {
  if (!enabled) return;
  win.__uzbekibleTest = parseTestParams(search);
}
