import { describe, expect, it } from 'vitest';

// Q4: core is pure logic with no DOM (docs/architecture.md). Its tests run in the `node`
// environment, so any document/window use in core fails here instead of passing under jsdom.
describe('core test environment', () => {
  it('has no DOM', () => {
    expect(typeof document).toBe('undefined');
    expect(typeof window).toBe('undefined');
  });
});
