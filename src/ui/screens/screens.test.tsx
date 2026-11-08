import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Countdown, PauseOverlay, ResultsScreen, RunResultsScreen } from './index';

describe('Countdown', () => {
  it('shows whole seconds remaining, rounding up, then Go', () => {
    const { rerender } = render(<Countdown remainingMs={2_001} />);
    expect(screen.getByRole('status')).toHaveTextContent('3');
    rerender(<Countdown remainingMs={1} />);
    expect(screen.getByRole('status')).toHaveTextContent('1');
    rerender(<Countdown remainingMs={0} />);
    expect(screen.getByRole('status')).toHaveTextContent(/bosh/i);
  });
});

describe('PauseOverlay', () => {
  it('is a modal dialog with a resume button', async () => {
    const onResume = vi.fn();
    render(<PauseOverlay onResume={onResume} onMap={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /pauza/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /davom/i }));
    expect(onResume).toHaveBeenCalledOnce();
  });
});

describe('ResultsScreen', () => {
  const base = {
    score: 420,
    timeMs: 75_000,
    mistakes: 1,
    hints: 0,
    onReplay: vi.fn(),
    onMap: vi.fn(),
  };

  it('shows stars, score, time and new best on a win', () => {
    render(<ResultsScreen {...base} won stars={2} newBest onNext={vi.fn()} />);
    expect(screen.getByRole('img', { name: /2\/3/ })).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByText('1:15')).toBeInTheDocument();
    expect(screen.getByText(/yangi rekord/i)).toBeInTheDocument();
  });

  it('omits new best when not a record', () => {
    render(<ResultsScreen {...base} won stars={3} newBest={false} onNext={vi.fn()} />);
    expect(screen.queryByText(/yangi rekord/i)).toBeNull();
  });

  it('offers Next, Replay and Map on a win', async () => {
    const onNext = vi.fn();
    const onReplay = vi.fn();
    const onMap = vi.fn();
    render(
      <ResultsScreen
        {...base}
        won
        stars={1}
        newBest={false}
        onNext={onNext}
        onReplay={onReplay}
        onMap={onMap}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /keyingi/i }));
    await userEvent.click(screen.getByRole('button', { name: /qayta/i }));
    await userEvent.click(screen.getByRole('button', { name: /xarita/i }));
    expect([onNext, onReplay, onMap].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it('on a loss offers retry and map but no next, stars or score', () => {
    render(<ResultsScreen {...base} won={false} stars={0} newBest={false} />);
    expect(screen.getByRole('button', { name: /qayta urinish/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /keyingi/i })).toBeNull();
    expect(screen.queryByRole('img', { name: /\/3/ })).toBeNull();
    expect(screen.queryByText('420')).toBeNull();
  });
});

describe('RunResultsScreen', () => {
  const base = {
    score: 640,
    streak: 8,
    correct: 11,
    mistakes: 3,
    best: { score: 800, streak: 9 },
    newBest: false,
    onReplay: vi.fn(),
    onHome: vi.fn(),
  };

  it('shows the run, the best so far and the actions', async () => {
    render(<RunResultsScreen {...base} />);
    expect(screen.getByRole('heading', { name: 'Yugurish tugadi' })).toBeInTheDocument();
    expect(screen.getByText('Ball').nextSibling).toHaveTextContent('640');
    expect(screen.getByText('Eng uzun seriya').nextSibling).toHaveTextContent('8');
    expect(screen.getByText('Rekord').nextSibling).toHaveTextContent('800');
    expect(screen.queryByText('Yangi rekord!')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Qayta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bosh sahifa' }));
    expect(base.onReplay).toHaveBeenCalledOnce();
    expect(base.onHome).toHaveBeenCalledOnce();
  });

  it('flags a new best, and reads in Cyrillic', () => {
    render(<RunResultsScreen {...base} newBest script="cyrl" />);
    expect(screen.getByText('Янги рекорд!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Қайта' })).toBeInTheDocument();
  });
});
