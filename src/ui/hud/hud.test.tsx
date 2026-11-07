import { render, screen } from '@testing-library/react';
import { Combo, Lives, LevelBadge, Score, Timer, formatTime } from './index';

describe('formatTime', () => {
  it('formats milliseconds as m:ss, rounding down', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9_999)).toBe('0:09');
    expect(formatTime(61_000)).toBe('1:01');
    expect(formatTime(-5)).toBe('0:00');
  });
});

describe('HUD', () => {
  it('Timer shows elapsed time with an accessible name', () => {
    render(<Timer ms={65_000} />);
    expect(screen.getByRole('timer', { name: /vaqt/i })).toHaveTextContent('1:05');
  });

  it('Lives shows remaining and lost tiles without relying on colour', () => {
    render(<Lives lives={2} max={3} />);
    const lives = screen.getByRole('img', { name: /2\/3/ });
    expect(lives.querySelectorAll('[data-cracked="true"]')).toHaveLength(1);
    expect(lives.querySelectorAll('[data-cracked="false"]')).toHaveLength(2);
  });

  it('Score and LevelBadge show their values', () => {
    render(
      <>
        <Score value={1234} />
        <LevelBadge level={7} />
      </>,
    );
    expect(screen.getByLabelText(/ball/i)).toHaveTextContent('1234');
    expect(screen.getByLabelText(/daraja/i)).toHaveTextContent('7');
  });

  it('Combo is hidden below 2 and shown from 2', () => {
    const { rerender } = render(<Combo count={1} />);
    expect(screen.queryByLabelText(/kombo/i)).toBeNull();
    rerender(<Combo count={3} />);
    expect(screen.getByLabelText(/kombo/i)).toHaveTextContent('3');
  });

  it('renders Cyrillic labels when the script is Cyrillic', () => {
    render(<Timer ms={0} script="cyrl" />);
    expect(screen.getByRole('timer', { name: 'Вақт' })).toBeInTheDocument();
  });
});
