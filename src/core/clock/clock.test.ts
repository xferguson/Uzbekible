import { describe, expect, it, vi } from 'vitest';
import { createFakeClock, frameLoop, systemClock } from './index';

describe('createFakeClock', () => {
  it('starts at the given time and advances', () => {
    const clock = createFakeClock(100);
    expect(clock.now()).toBe(100);
    clock.advance(50);
    expect(clock.now()).toBe(150);
  });
  it('defaults to 0 and rejects negative advances', () => {
    const clock = createFakeClock();
    expect(clock.now()).toBe(0);
    expect(() => clock.advance(-1)).toThrow(RangeError);
  });
});

describe('frameLoop with a fake clock', () => {
  it('ticks once per frame with the elapsed delta', () => {
    const clock = createFakeClock();
    const deltas: number[] = [];
    frameLoop(clock, (dt) => deltas.push(dt));
    clock.advance(48);
    expect(deltas).toEqual([16, 16, 16]);
  });

  it('delivers a final partial frame so no time is lost', () => {
    const clock = createFakeClock();
    let total = 0;
    frameLoop(clock, (dt) => (total += dt));
    clock.advance(40);
    expect(total).toBe(40);
  });

  it('passes the current time and stops when asked', () => {
    const clock = createFakeClock(1000);
    const times: number[] = [];
    const stop = frameLoop(clock, (_dt, now) => times.push(now));
    clock.advance(32);
    stop();
    clock.advance(64);
    expect(times).toEqual([1016, 1032]);
  });

  it('can be stopped from inside its own callback', () => {
    const clock = createFakeClock();
    let calls = 0;
    const stop = frameLoop(clock, () => {
      if (++calls === 2) stop();
    });
    clock.advance(160);
    expect(calls).toBe(2);
  });
});

describe('systemClock', () => {
  it('reports a non-decreasing time', () => {
    const a = systemClock.now();
    expect(systemClock.now()).toBeGreaterThanOrEqual(a);
  });

  it('drives frames from the platform scheduler and can cancel', () => {
    vi.useFakeTimers();
    try {
      const cb = vi.fn();
      const cancel = systemClock.requestFrame(cb);
      vi.advanceTimersByTime(100);
      expect(cb).toHaveBeenCalledTimes(1);
      const cb2 = vi.fn();
      systemClock.requestFrame(cb2)();
      vi.advanceTimersByTime(100);
      expect(cb2).not.toHaveBeenCalled();
      cancel();
    } finally {
      vi.useRealTimers();
    }
  });
});
