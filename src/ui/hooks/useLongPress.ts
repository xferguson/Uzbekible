import { useCallback, useEffect, useMemo, useRef, type MouseEvent, type PointerEvent } from 'react';
import { frameLoop, systemClock, type FrameClock } from '@core/clock';

export interface LongPressOptions {
  /** Hold time in ms (default 500). */
  ms?: number;
  /** Movement in px that cancels the press (default 10). */
  tolerance?: number;
  /** Injected clock (tests pass a fake). */
  clock?: FrameClock;
}

export interface LongPressHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: MouseEvent) => void;
}

/** Touch/mouse/pen long press; fires `onLongPress` once per hold, cancels on move, release or leave. */
export function useLongPress(
  onLongPress: () => void,
  options: LongPressOptions = {},
): LongPressHandlers {
  const { ms = 500, tolerance = 10, clock = systemClock } = options;
  const stop = useRef<(() => void) | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | undefined>(undefined);
  const callback = useRef(onLongPress);
  useEffect(() => {
    callback.current = onLongPress;
  });

  const cancel = useCallback(() => {
    stop.current?.();
    stop.current = undefined;
    origin.current = undefined;
  }, []);

  useEffect(() => cancel, [cancel]);

  return useMemo(
    () => ({
      onPointerDown: (e: PointerEvent) => {
        cancel();
        origin.current = { x: e.clientX, y: e.clientY };
        const start = clock.now();
        const end = frameLoop(clock, (_dt, now) => {
          if (now - start < ms) return;
          cancel();
          callback.current();
        });
        stop.current = end;
      },
      onPointerMove: (e: PointerEvent) => {
        const o = origin.current;
        if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > tolerance) cancel();
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      // Long-press on touch opens the browser context menu; the hint replaces it.
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    }),
    [cancel, clock, ms, tolerance],
  );
}
