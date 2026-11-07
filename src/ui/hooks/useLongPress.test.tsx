import { act, fireEvent, render, screen } from '@testing-library/react';
import { useLongPress } from './useLongPress';

function Probe({ onLong, ms }: { onLong: () => void; ms?: number }) {
  const handlers = useLongPress(onLong, ms === undefined ? {} : { ms });
  return <button {...handlers}>hold</button>;
}

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires once after the delay', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} />);
    fireEvent.pointerDown(screen.getByRole('button'), { clientX: 5, clientY: 5 });
    act(() => void vi.advanceTimersByTime(499));
    expect(fn).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(2));
    act(() => void vi.advanceTimersByTime(2000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not fire on a short tap', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b);
    act(() => void vi.advanceTimersByTime(100));
    fireEvent.pointerUp(b);
    act(() => void vi.advanceTimersByTime(1000));
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancels when the pointer moves beyond tolerance', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(b, { clientX: 40, clientY: 0 });
    act(() => void vi.advanceTimersByTime(1000));
    expect(fn).not.toHaveBeenCalled();
  });

  it('ignores tiny jitter', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(b, { clientX: 2, clientY: 1 });
    act(() => void vi.advanceTimersByTime(600));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels on leave/cancel and honours custom ms', () => {
    const fn = vi.fn();
    render(<Probe onLong={fn} ms={200} />);
    const b = screen.getByRole('button');
    fireEvent.pointerDown(b);
    fireEvent.pointerLeave(b);
    act(() => void vi.advanceTimersByTime(300));
    expect(fn).not.toHaveBeenCalled();
    fireEvent.pointerDown(b);
    act(() => void vi.advanceTimersByTime(250));
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(b);
    fireEvent.pointerCancel(b);
    act(() => void vi.advanceTimersByTime(300));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('suppresses the context menu after a long press', () => {
    render(<Probe onLong={() => undefined} />);
    const b = screen.getByRole('button');
    expect(fireEvent.contextMenu(b)).toBe(false);
  });
});
