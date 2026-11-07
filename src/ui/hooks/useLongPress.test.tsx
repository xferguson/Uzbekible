import { act, fireEvent, render, screen } from '@testing-library/react';
import { createFakeClock, type FakeClock } from '@core/clock';
import { useLongPress } from './useLongPress';

function Probe({ onLong, ms, clock }: { onLong: () => void; ms?: number; clock: FakeClock }) {
  const handlers = useLongPress(onLong, ms === undefined ? { clock } : { ms, clock });
  return <button {...handlers}>hold</button>;
}

describe('useLongPress', () => {
  let clock: FakeClock;
  beforeEach(() => {
    clock = createFakeClock();
  });

  it('fires once after the delay', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} clock={clock} />);
    fireEvent.pointerDown(screen.getByRole('button'), { clientX: 5, clientY: 5 });
    act(() => clock.advance(499));
    expect(fn).not.toHaveBeenCalled();
    act(() => clock.advance(2));
    act(() => clock.advance(2000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not fire on a short tap', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} clock={clock} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b);
    act(() => clock.advance(100));
    fireEvent.pointerUp(b);
    act(() => clock.advance(1000));
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancels when the pointer moves beyond tolerance', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} clock={clock} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(b, { clientX: 40, clientY: 0 });
    act(() => clock.advance(1000));
    expect(fn).not.toHaveBeenCalled();
  });

  it('ignores tiny jitter', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} clock={clock} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(b, { clientX: 2, clientY: 1 });
    act(() => clock.advance(600));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels on leave/cancel and honours custom ms', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} ms={200} clock={clock} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b);
    fireEvent.pointerLeave(b);
    act(() => clock.advance(300));
    expect(fn).not.toHaveBeenCalled();
    fireEvent.pointerDown(b);
    act(() => clock.advance(250));
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(b);
    fireEvent.pointerCancel(b);
    act(() => clock.advance(300));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('suppresses the context menu after a long press', () => {
    render(<Probe onLong={() => undefined} clock={clock} />);
    const b = screen.getByRole('button');
    expect(fireEvent.contextMenu(b)).toBe(false);
  });
});
