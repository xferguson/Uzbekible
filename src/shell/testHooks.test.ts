import { installTestHooks, parseTestParams } from './testHooks';

describe('parseTestParams', () => {
  it('parses ?seed=42&clock=fake', () => {
    expect(parseTestParams('?seed=42&clock=fake')).toEqual({ seed: 42, fakeClock: true });
  });
  it('defaults when params are absent', () => {
    expect(parseTestParams('')).toEqual({ seed: undefined, fakeClock: false });
  });
  it('ignores a non-numeric seed and unknown clock values', () => {
    expect(parseTestParams('?seed=abc&clock=real')).toEqual({ seed: undefined, fakeClock: false });
  });
  it('accepts negative and zero seeds', () => {
    expect(parseTestParams('?seed=0').seed).toBe(0);
    expect(parseTestParams('?seed=-7').seed).toBe(-7);
  });
});

describe('installTestHooks', () => {
  it('exposes window.__uzbekibleTest when enabled', () => {
    const win = {} as Window;
    installTestHooks(win, '?seed=1&clock=fake', true);
    expect(win.__uzbekibleTest).toEqual({ seed: 1, fakeClock: true });
  });
  it('does nothing when disabled (production builds)', () => {
    const win = {} as Window;
    installTestHooks(win, '?seed=1&clock=fake', false);
    expect(win.__uzbekibleTest).toBeUndefined();
  });
});
