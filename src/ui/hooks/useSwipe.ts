import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { systemClock, type FrameClock } from '@core/clock';

export type SwipeDirection = 'left' | 'right';

export interface SwipeOptions {
  /** Horizontal distance in px that commits a swipe (default 60). */
  distance?: number;
  /** Speed in px/ms that commits a shorter flick (default 0.5, needs at least distance / 3). */
  velocity?: number;
  /** Movement in px under which a release counts as a tap (default 10). */
  tapTolerance?: number;
  /** Injected clock (tests pass a fake). */
  clock?: Pick<FrameClock, 'now'>;
  /** Force reduced motion; defaults to the `prefers-reduced-motion` media query. */
  reducedMotion?: boolean;
}

export interface SwipeBindings {
  tabIndex: 0;
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}

export interface SwipeResult {
  bind: SwipeBindings;
  /** Live drag offset in px for animation; always 0 under reduced motion. */
  offsetX: number;
  /** Direction of the drag in progress, or null. */
  direction: SwipeDirection | null;
}

/** True when the user asks for reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Decides whether a finished horizontal drag commits a swipe. */
export function swipeOutcome(
  dx: number,
  dy: number,
  elapsedMs: number,
  distance: number,
  velocity: number,
): SwipeDirection | null {
  const ax = Math.abs(dx);
  if (ax <= Math.abs(dy)) return null;
  const fast = ax >= distance / 3 && ax / Math.max(elapsedMs, 1) >= velocity;
  if (ax < distance && !fast) return null;
  return dx < 0 ? 'left' : 'right';
}

/**
 * Horizontal swipe with a distance/velocity threshold, tap-on-side and arrow-key fallbacks.
 * `onSwipe` fires once per gesture; below-threshold and vertical drags snap back silently.
 */
export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  options: SwipeOptions = {},
): SwipeResult {
  const { distance = 60, velocity = 0.5, tapTolerance = 10, clock = systemClock } = options;
  const reduced = options.reducedMotion ?? prefersReducedMotion();
  const callback = useRef(onSwipe);
  useEffect(() => {
    callback.current = onSwipe;
  });
  const start = useRef<{ x: number; y: number; t: number; id: number } | undefined>(undefined);
  const [offsetX, setOffsetX] = useState(0);

  const reset = useCallback(() => {
    start.current = undefined;
    setOffsetX(0);
  }, []);

  const bind = useMemo<SwipeBindings>(
    () => ({
      tabIndex: 0,
      onPointerDown: (e) => {
        start.current = { x: e.clientX, y: e.clientY, t: clock.now(), id: e.pointerId };
        e.currentTarget.setPointerCapture?.(e.pointerId);
      },
      onPointerMove: (e) => {
        const s = start.current;
        if (!s || reduced) return;
        const dx = e.clientX - s.x;
        setOffsetX(Math.abs(dx) > Math.abs(e.clientY - s.y) ? dx : 0);
      },
      onPointerUp: (e) => {
        const s = start.current;
        reset();
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.hypot(dx, dy) <= tapTolerance) {
          const rect = e.currentTarget.getBoundingClientRect();
          callback.current(e.clientX - rect.left < rect.width / 2 ? 'left' : 'right');
          return;
        }
        const dir = swipeOutcome(dx, dy, clock.now() - s.t, distance, velocity);
        if (dir) callback.current(dir);
      },
      onPointerCancel: reset,
      onKeyDown: (e) => {
        if (e.key === 'ArrowLeft') callback.current('left');
        else if (e.key === 'ArrowRight') callback.current('right');
        else return;
        e.preventDefault();
      },
    }),
    [clock, distance, velocity, tapTolerance, reduced, reset],
  );

  return { bind, offsetX, direction: offsetX === 0 ? null : offsetX < 0 ? 'left' : 'right' };
}
