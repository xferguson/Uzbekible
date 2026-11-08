import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeClock } from '@core/clock';
import { createLearningLog } from '@core/learning-log';
import { createMemoryBackend } from '@core/storage';
import type { Rules } from '@core/session';
import type { BoardProps, GameDefinition } from '@games/types';
import { GameShell } from './GameShell';
import { createProgressStore, createRunBestStore } from './progress';

type State = { left: number };
type Action = { type: 'take' } | { type: 'miss' };

function Board({ state, dispatch }: BoardProps<{ n: number }, State, Action>) {
  return (
    <div data-testid="board">
      <span>left {state.game.left}</span>
      <button onClick={() => dispatch({ type: 'take' })}>take</button>
      <button onClick={() => dispatch({ type: 'miss' })}>miss</button>
    </div>
  );
}

const fake: GameDefinition<{ n: number }, State, Action> = {
  id: 'fake',
  title: { uzLatn: 'Soxta', uzCyrl: 'Сохта' },
  levels: (ctx) => ({ level: ctx.level, seed: ctx.seed, lives: 2, params: { n: 3 } }),
  createRules: (spec): Rules<State, Action> => ({
    init: { left: spec.params.n },
    reduce(state, action) {
      if (action.type === 'miss')
        return { state, events: [{ type: 'mistake' }, { type: 'lifeLost' }] };
      const left = state.left - 1;
      return {
        state: { left },
        events: left === 0 ? [{ type: 'combo' }, { type: 'complete' }] : [{ type: 'combo' }],
      };
    },
  }),
  scoring: {
    basePoints: 100,
    parMs: 10_000,
    overrunFactor: 2,
    mistakePenalty: 10,
    hintPenalty: 20,
    comboBonus: 5,
    starThresholds: [50, 100, 150],
  },
  difficulty: { params: {} },
  Board,
};

function setup(level = 1) {
  const clock = createFakeClock(1_000);
  const backend = createMemoryBackend();
  const progress = createProgressStore('fake', { backend });
  const log = createLearningLog({ clock, sessionId: 's1', storage: { backend } });
  const onNext = vi.fn();
  const onMap = vi.fn();
  render(
    <GameShell
      definition={fake}
      level={level}
      settings={{ sourceLangs: ['tr'], script: 'latn' }}
      history={[]}
      clock={clock}
      progress={progress}
      log={log}
      countdownMs={3_000}
      onNext={onNext}
      onMap={onMap}
    />,
  );
  const advance = (ms: number) =>
    act(() => {
      clock.advance(ms);
      vi.advanceTimersByTime(ms);
    });
  return { clock, progress, log, onNext, onMap, advance };
}

describe('GameShell', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('counts down, then shows the board and HUD', () => {
    const { advance } = setup();
    expect(screen.getByRole('status')).toHaveTextContent('3');
    expect(screen.queryByTestId('board')).toBeNull();
    advance(3_000);
    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /2\/2/ })).toBeInTheDocument();
    advance(5_000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:05');
  });

  it('hides the board while paused and resumes', async () => {
    vi.useRealTimers();
    const clock = createFakeClock(0);
    const backend = createMemoryBackend();
    render(
      <GameShell
        definition={fake}
        level={1}
        settings={{ sourceLangs: ['tr'], script: 'latn' }}
        history={[]}
        clock={clock}
        progress={createProgressStore('fake', { backend })}
        log={createLearningLog({ clock, sessionId: 's', storage: { backend } })}
        countdownMs={0}
        onMap={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /pauza/i }));
    expect(screen.queryByTestId('board')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /davom/i }));
    expect(screen.getByTestId('board')).toBeInTheDocument();
  });

  it('countdown → play → won → results; saves progress and logs the attempt', () => {
    const { advance, progress, log, onNext } = setup();
    advance(3_000);
    act(() => screen.getByRole('button', { name: 'take' }).click());
    expect(screen.queryByLabelText(/kombo/i)).toBeNull();
    act(() => screen.getByRole('button', { name: 'take' }).click());
    expect(screen.getByLabelText(/kombo/i)).toHaveTextContent('2');
    advance(2_000);
    act(() => screen.getByRole('button', { name: 'take' }).click());
    expect(screen.queryByTestId('board')).toBeNull();
    expect(screen.getByRole('img', { name: /\/3/ })).toBeInTheDocument();
    expect(screen.getByText(/yangi rekord/i)).toBeInTheDocument();
    expect(progress.get().unlocked).toBe(2);
    expect(progress.get().best[1]?.score).toBeGreaterThan(0);
    const types = log.events().map((e) => e.type);
    expect(types).toEqual(['level_start', 'level_complete']);
    act(() => screen.getByRole('button', { name: /keyingi/i }).click());
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('does not report a new best on a worse replay', () => {
    const { advance, progress } = setup();
    advance(3_000);
    for (let i = 0; i < 3; i++) act(() => screen.getByRole('button', { name: 'take' }).click());
    const best = progress.get().best[1]!.score;
    act(() => screen.getByRole('button', { name: /qayta$/i }).click());
    advance(3_000);
    advance(60_000); // far past par: lower score
    for (let i = 0; i < 3; i++) act(() => screen.getByRole('button', { name: 'take' }).click());
    expect(screen.queryByText(/yangi rekord/i)).toBeNull();
    expect(progress.get().best[1]!.score).toBe(best);
  });

  it('losing all lives shows retry, saves nothing and logs a failure; retry restarts', () => {
    const { advance, progress, log } = setup();
    advance(3_000);
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    expect(screen.getByRole('img', { name: /1\/2/ })).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    expect(screen.getByRole('button', { name: /qayta urinish/i })).toBeInTheDocument();
    expect(progress.get()).toEqual({ unlocked: 1, best: {} });
    expect(log.events().map((e) => e.type)).toEqual(['level_start', 'level_failed']);
    act(() => screen.getByRole('button', { name: /qayta urinish/i }).click());
    expect(screen.getByRole('status')).toHaveTextContent('3');
    expect(log.events().map((e) => e.type)).toEqual(['level_start', 'level_failed', 'level_start']);
  });

  it('Map button calls onMap', () => {
    const { advance, onMap } = setup();
    advance(3_000);
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    act(() => screen.getByRole('button', { name: /xarita/i }).click());
    expect(onMap).toHaveBeenCalledOnce();
  });

  it('passes the mode to levels (seed) and to multipliers', () => {
    vi.useRealTimers();
    const clock = createFakeClock(0);
    const backend = createMemoryBackend();
    const seen: Array<string | undefined> = [];
    const multipliers = vi.fn((_s: unknown, mode?: string) => [mode === 'qiyin' ? 2 : 1]);
    const def: typeof fake = {
      ...fake,
      modes: [{ id: 'qiyin', name: { uzLatn: 'Qiyin', uzCyrl: 'Қийин' } }],
      levels: (ctx) => {
        seen.push(ctx.mode);
        return { level: ctx.level, seed: ctx.seed, lives: 2, params: { n: 1 } };
      },
      multipliers,
    };
    render(
      <GameShell
        definition={def}
        mode="qiyin"
        level={1}
        settings={{ sourceLangs: ['tr'], script: 'latn' }}
        history={[]}
        clock={clock}
        progress={createProgressStore('fake', { backend }, 'qiyin')}
        log={createLearningLog({ clock, sessionId: 's', storage: { backend } })}
        countdownMs={0}
        onMap={() => {}}
      />,
    );
    expect(seen[0]).toBe('qiyin');
    expect(multipliers).toHaveBeenCalledWith(expect.anything(), 'qiyin');
  });
});

describe('GameShell: an endless game', () => {
  const endless: GameDefinition<{ n: number }, State, Action> = {
    ...fake,
    id: 'endless',
    endless: {
      summary: (g) => ({ score: 40 + g.left, streak: 7, correct: 5, mistakes: 2 }),
      holdMs: 1_000,
    },
  };

  function run() {
    const clock = createFakeClock(1_000);
    const backend = createMemoryBackend();
    const progress = createProgressStore('endless', { backend });
    const runBest = createRunBestStore('endless', { backend });
    const log = createLearningLog({ clock, sessionId: 's1', storage: { backend } });
    const onMap = vi.fn();
    render(
      <GameShell
        definition={endless}
        level={1}
        settings={{ sourceLangs: ['tr'], script: 'latn' }}
        history={[]}
        clock={clock}
        progress={progress}
        runBest={runBest}
        log={log}
        countdownMs={0}
        onMap={onMap}
      />,
    );
    const advance = (ms: number) =>
      act(() => {
        clock.advance(ms);
        vi.advanceTimersByTime(ms);
      });
    return { runBest, onMap, advance, log };
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows only a pause button over the board, not the level HUD', () => {
    const { advance } = run();
    advance(200);
    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pauza' })).toBeInTheDocument();
    expect(screen.queryByText(/daraja/i)).toBeNull();
  });

  it('holds the last answer, then shows run results and keeps the best', () => {
    const { advance, runBest, onMap } = run();
    advance(200);
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    expect(screen.getByTestId('board')).toBeInTheDocument();
    advance(500);
    expect(screen.getByTestId('board')).toBeInTheDocument();
    advance(600);
    expect(screen.queryByTestId('board')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Yugurish tugadi' })).toBeInTheDocument();
    expect(screen.getByText('Yangi rekord!')).toBeInTheDocument();
    expect(runBest.get()).toEqual({ score: 43, streak: 7 });
    act(() => screen.getByRole('button', { name: 'Bosh sahifa' }).click());
    expect(onMap).toHaveBeenCalled();
  });

  it('replays into a fresh run', () => {
    const { advance } = run();
    advance(200);
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    act(() => screen.getByRole('button', { name: 'miss' }).click());
    advance(1_100);
    act(() => screen.getByRole('button', { name: 'Qayta' }).click());
    advance(200);
    expect(screen.getByTestId('board')).toBeInTheDocument();
  });
});
