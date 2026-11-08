import { act, fireEvent, render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { createFakeClock, type FakeClock } from '@core/clock';
import { swipeOutcome, useSwipe, type SwipeOptions } from './useSwipe';

function Probe({ onSwipe, options }: { onSwipe: (d: string) => void; options: SwipeOptions }) {
  const { bind, offsetX, direction } = useSwipe(onSwipe, options);
  return (
    <div role="group" aria-label="card" {...bind}>
      <span data-testid="o">{offsetX}</span>
      <span data-testid="d">{direction ?? 'none'}</span>
    </div>
  );
}

describe('useSwipe', () => {
  let clock: FakeClock;
  beforeEach(() => {
    clock = createFakeClock();
  });

  function setup(options: SwipeOptions = {}) {
    const fn = vi.fn();
    render(<Probe onSwipe={fn} options={{ clock, reducedMotion: false, ...options }} />);
    const el = screen.getByRole('group');
    el.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;
    return { fn, el };
  }
  const drag = (el: HTMLElement, dx: number, dy = 0, ms = 500) => {
    fireEvent.pointerDown(el, { clientX: 100, clientY: 100, pointerId: 1 });
    act(() => clock.advance(ms));
    fireEvent.pointerMove(el, { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
    fireEvent.pointerUp(el, { clientX: 100 + dx, clientY: 100 + dy, pointerId: 1 });
  };

  it('fires onSwipe("right") once for a long rightward drag', () => {
    const { fn, el } = setup();
    drag(el, 120);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('right');
  });

  it('fires "left" for a leftward drag', () => {
    const { fn, el } = setup();
    drag(el, -120);
    expect(fn).toHaveBeenCalledWith('left');
  });

  it('snaps back without a callback below the threshold', () => {
    const { fn, el } = setup();
    drag(el, 40);
    expect(fn).not.toHaveBeenCalled();
    expect(screen.getByTestId('o').textContent).toBe('0');
  });

  it('commits a short fast flick', () => {
    const { fn, el } = setup();
    drag(el, 30, 0, 20);
    expect(fn).toHaveBeenCalledWith('right');
  });

  it('ignores vertical-dominant drags', () => {
    const { fn, el } = setup();
    drag(el, 80, 200);
    expect(fn).not.toHaveBeenCalled();
  });

  it('exposes live offset and direction while dragging', () => {
    const { el } = setup();
    fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(el, { clientX: 70, clientY: 100 });
    expect(screen.getByTestId('o').textContent).toBe('-30');
    expect(screen.getByTestId('d').textContent).toBe('left');
    fireEvent.pointerCancel(el);
    expect(screen.getByTestId('d').textContent).toBe('none');
  });

  it('keeps offset at 0 under reduced motion but still swipes', () => {
    const { fn, el } = setup({ reducedMotion: true });
    fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(el, { clientX: 20, clientY: 100 });
    expect(screen.getByTestId('o').textContent).toBe('0');
    fireEvent.pointerUp(el, { clientX: 20, clientY: 100 });
    expect(fn).toHaveBeenCalledWith('left');
  });

  it('reads the prefers-reduced-motion media query by default', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
    const fn = vi.fn();
    render(<Probe onSwipe={fn} options={{ clock }} />);
    const el = screen.getByRole('group');
    fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(el, { clientX: 20, clientY: 100 });
    expect(screen.getByTestId('o').textContent).toBe('0');
    // @ts-expect-error restore jsdom default
    delete window.matchMedia;
  });

  it('treats a tap on either side as a swipe in that direction', () => {
    const { fn, el } = setup();
    fireEvent.pointerDown(el, { clientX: 20, clientY: 5 });
    fireEvent.pointerUp(el, { clientX: 20, clientY: 5 });
    fireEvent.pointerDown(el, { clientX: 180, clientY: 5 });
    fireEvent.pointerUp(el, { clientX: 180, clientY: 5 });
    expect(fn.mock.calls).toEqual([['left'], ['right']]);
  });

  it('maps arrow keys and ignores others', () => {
    const { fn, el } = setup();
    fireEvent.keyDown(el, { key: 'ArrowLeft' });
    fireEvent.keyDown(el, { key: 'ArrowRight' });
    fireEvent.keyDown(el, { key: 'a' });
    expect(fn.mock.calls).toEqual([['left'], ['right']]);
  });

  it('ignores pointerup without a pointerdown', () => {
    const { fn, el } = setup();
    fireEvent.pointerUp(el, { clientX: 5, clientY: 5 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('fires once per gesture', () => {
    const { fn, el } = setup();
    drag(el, 120);
    fireEvent.pointerUp(el, { clientX: 220, clientY: 100 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('swipeOutcome properties', () => {
  it('never fires for slow drags shorter than the distance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -59, max: 59 }),
        fc.integer({ min: -300, max: 300 }),
        (dx, dy) => {
          expect(swipeOutcome(dx, dy, 5000, 60, 0.5)).toBeNull();
        },
      ),
    );
  });

  it('never fires when vertical dominates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: 500 }),
        fc.integer({ min: 0, max: 5000 }),
        (dx, ms) => {
          expect(swipeOutcome(dx, Math.abs(dx) + 1, ms, 60, 0.5)).toBeNull();
        },
      ),
    );
  });

  it('direction follows the sign of dx for long drags', () => {
    fc.assert(
      fc.property(fc.integer({ min: 60, max: 800 }), fc.boolean(), (n, neg) => {
        expect(swipeOutcome(neg ? -n : n, 0, 1000, 60, 0.5)).toBe(neg ? 'left' : 'right');
      }),
    );
  });
});
