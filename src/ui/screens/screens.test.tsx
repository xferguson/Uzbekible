import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Countdown,
  groupDigits,
  PauseOverlay,
  ReadyCard,
  ResultsScreen,
  RunResultsScreen,
} from './index';

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

  it('offers a restart and a note only when given', async () => {
    const onRestart = vi.fn();
    const { rerender } = render(<PauseOverlay onResume={vi.fn()} onMap={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Qayta boshlash' })).toBeNull();
    rerender(
      <PauseOverlay onResume={vi.fn()} onMap={vi.fn()} onRestart={onRestart} note="Hidden." />,
    );
    expect(screen.getByText('Hidden.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Qayta boshlash' }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it('as a card it offers the same actions in a modal dialog', async () => {
    const onResume = vi.fn();
    const onRestart = vi.fn();
    const onMap = vi.fn();
    render(
      <PauseOverlay
        card
        note="Hidden."
        mapLabel="Bosh sahifa"
        onResume={onResume}
        onRestart={onRestart}
        onMap={onMap}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Pauza' })).toBeInTheDocument();
    expect(screen.getByText('Hidden.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Davom etish/ }));
    await userEvent.click(screen.getByRole('button', { name: /Qayta boshlash/ }));
    await userEvent.click(screen.getByRole('button', { name: /Bosh sahifa/ }));
    expect([onResume, onRestart, onMap].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it('as a card it leaves out Restart when not offered', () => {
    render(<PauseOverlay card onResume={vi.fn()} onMap={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Qayta boshlash/ })).toBeNull();
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
    score: 1240,
    previousBest: 980,
    newBest: true,
    cards: 23,
    streak: 9,
    correct: 20,
    timeMs: 71_300,
    missed: [
      {
        id: 'tun',
        uz: { latn: 'tun', cyrl: 'тун' },
        uzMeaning: 'night',
        source: { lang: 'tr' as const, text: 'dün' },
        sourceMeaning: 'yesterday',
      },
      {
        id: 'daryo',
        uz: { latn: 'daryo', cyrl: 'дарё' },
        uzMeaning: 'river',
        source: { lang: 'tr' as const, text: 'derya' },
      },
    ],
    onReplay: vi.fn(),
    onHome: vi.fn(),
  };

  it('celebrates a new best: verdict, ribbon, grouped score and what it beat', () => {
    render(<RunResultsScreen {...base} />);
    expect(screen.getByRole('heading', { name: 'Barakalla!' })).toBeInTheDocument();
    expect(screen.getByText('Yangi rekord!')).toBeInTheDocument();
    expect(screen.getByTestId('run-score').textContent).toBe('1\u202f240');
    expect(screen.getByText('points · was 980')).toBeInTheDocument();
  });

  it('shows the four stats: cards, best streak, share right and average time', () => {
    render(<RunResultsScreen {...base} />);
    expect(screen.getByText('cards').nextSibling).toHaveTextContent('23');
    expect(screen.getByText('best streak').nextSibling).toHaveTextContent('9');
    expect(screen.getByText('right').nextSibling).toHaveTextContent('87%');
    expect(screen.getByText('avg time').nextSibling).toHaveTextContent('3.1s');
  });

  it('lists each missed pair with both meanings, and the source word alone when it has none', () => {
    render(<RunResultsScreen {...base} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('tun = night');
    expect(rows[0]).toHaveTextContent('dün = yesterday');
    expect(rows[1]).toHaveTextContent('daryo = river');
    expect(rows[1]).not.toHaveTextContent('=  ');
  });

  it('without a record says Yaxshi! and the best to beat; no missed list when nothing was missed', async () => {
    render(<RunResultsScreen {...base} newBest={false} score={760} missed={[]} />);
    expect(screen.getByRole('heading', { name: 'Yaxshi!' })).toBeInTheDocument();
    expect(screen.queryByText('Yangi rekord!')).toBeNull();
    expect(screen.getByText('points · best 980')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Yana/ }));
    await userEvent.click(screen.getByRole('button', { name: /Bosh sahifa/ }));
    expect(base.onReplay).toHaveBeenCalledOnce();
    expect(base.onHome).toHaveBeenCalledOnce();
  });

  it('copes with a run of no cards, and reads Uzbek in Cyrillic', () => {
    render(<RunResultsScreen {...base} cards={0} correct={0} script="cyrl" />);
    expect(screen.getByText('right').nextSibling).toHaveTextContent('0%');
    expect(screen.getByText('avg time').nextSibling).toHaveTextContent('0.0s');
    expect(screen.getByRole('heading', { name: 'Баракалла!' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('тун = night');
  });
});

describe('ReadyCard', () => {
  const props = {
    kicker: 'Game 5 · False friends',
    title: 'Soxta',
    blurb: 'Two words look alike.',
    sample: <span>sample</span>,
    stats: [
      { label: 'Lives', value: 3 },
      { label: 'Best streak', value: 11 },
    ],
    onScript: vi.fn(),
    onStart: vi.fn(),
  };

  it('shows the game, its best so far and the sample', () => {
    render(<ReadyCard {...props} />);
    expect(screen.getByRole('heading', { name: 'Soxta' })).toBeInTheDocument();
    expect(screen.getByText('Best streak').nextSibling).toHaveTextContent('11');
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('switches the script and starts', async () => {
    render(<ReadyCard {...props} />);
    expect(screen.getByRole('radio', { name: /Latin/ })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: /Cyrillic/ }));
    expect(props.onScript).toHaveBeenCalledWith('cyrl');
    await userEvent.click(screen.getByRole('button', { name: /Boshlash/ }));
    expect(props.onStart).toHaveBeenCalledOnce();
  });

  it('marks Cyrillic when it is the script in force', () => {
    render(<ReadyCard {...props} script="cyrl" />);
    expect(screen.getByRole('radio', { name: /Cyrillic/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: /Бошлаш/ })).toBeInTheDocument();
  });
});

describe('groupDigits', () => {
  it('groups thousands with a thin no-break space', () => {
    expect(groupDigits(980)).toBe('980');
    expect(groupDigits(1240)).toBe('1\u202f240');
    expect(groupDigits(1234567)).toBe('1\u202f234\u202f567');
  });
});
