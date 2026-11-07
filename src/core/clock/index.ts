/** Injectable time. Games and session code take a Clock; tests pass a fake one. */

export interface Clock {
  /** Milliseconds, monotonic. */
  now(): number;
}

/** A clock that can also schedule animation frames. */
export interface FrameClock extends Clock {
  /** Calls `cb(now)` on the next frame; returns a cancel function. */
  requestFrame(cb: (now: number) => void): () => void;
}

export interface FakeClock extends FrameClock {
  /** Moves time forward, firing frame callbacks every FRAME_MS (plus a final partial frame). */
  advance(ms: number): void;
}

export const FRAME_MS = 16;

export const systemClock: FrameClock = {
  now: () => performance.now(),
  requestFrame(cb) {
    if (typeof requestAnimationFrame === 'function') {
      const id = requestAnimationFrame(() => cb(performance.now()));
      return () => cancelAnimationFrame(id);
    }
    const id = setTimeout(() => cb(performance.now()), FRAME_MS);
    return () => clearTimeout(id);
  },
};

export function createFakeClock(start = 0): FakeClock {
  let time = start;
  let pending: { cb: (now: number) => void; live: boolean }[] = [];
  const tick = (): void => {
    const batch = pending;
    pending = [];
    for (const entry of batch) if (entry.live) entry.cb(time);
  };
  return {
    now: () => time,
    requestFrame(cb) {
      const entry = { cb, live: true };
      pending.push(entry);
      return () => {
        entry.live = false;
      };
    },
    advance(ms) {
      if (ms < 0) throw new RangeError(`advance(${ms}): ms must be >= 0`);
      let left = ms;
      while (left > 0) {
        const step = Math.min(FRAME_MS, left);
        time += step;
        left -= step;
        tick();
      }
    },
  };
}

/** Calls `cb(deltaMs, now)` every frame until the returned stop function is called. */
export function frameLoop(
  clock: FrameClock,
  cb: (deltaMs: number, now: number) => void,
): () => void {
  let running = true;
  let last = clock.now();
  let cancel = (): void => {};
  const onFrame = (now: number): void => {
    if (!running) return;
    const dt = now - last;
    last = now;
    cb(dt, now);
    if (running) cancel = clock.requestFrame(onFrame);
  };
  cancel = clock.requestFrame(onFrame);
  return () => {
    running = false;
    cancel();
  };
}
