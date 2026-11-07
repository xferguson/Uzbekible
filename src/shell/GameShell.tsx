import { useEffect, useReducer, useState } from 'react';
import type { Clock } from '@core/clock';
import type { Aggregate, LearningLog } from '@core/learning-log';
import { createRng, seedFrom } from '@core/random';
import { score as scoreOf, stars as starsOf, type Stars } from '@core/scoring';
import {
  createSession,
  tallyScoreInput,
  type GameEvent,
  type Session,
  type SessionEvent,
} from '@core/session';
import type { Store } from '@core/storage';
import { levelContext } from '@games/sim-adapter';
import type { AnyGameDefinition } from '@games/registry';
import type { BoardProps, GameSettings } from '@games/types';
import {
  Combo,
  Countdown,
  LevelBadge,
  Lives,
  PauseOverlay,
  ResultsScreen,
  Score,
  Timer,
} from '@ui/index';
import { label } from '../ui/labels';
import { recordWin, type Progress } from './progress';

export interface GameShellProps {
  definition: AnyGameDefinition;
  level: number;
  /** The chosen difficulty mode, for a game that declares `modes`. */
  mode?: string;
  settings: GameSettings;
  history: readonly Aggregate[];
  clock: Clock;
  progress: Store<Progress>;
  log: LearningLog;
  /** Length of the 3-2-1 before play. */
  countdownMs?: number;
  onNext?: () => void;
  onMap: () => void;
}

interface Outcome {
  won: boolean;
  score: number;
  stars: Stars;
  timeMs: number;
  mistakes: number;
  hints: number;
  newBest: boolean;
}

/** Re-render interval while time is moving (display only; the session reads the injected clock). */
const TICK_MS = 100;

/** Hosts a `GameDefinition`: countdown, HUD, pause, results, progress and learning-log writes. */
export function GameShell(props: GameShellProps) {
  const [attempt, setAttempt] = useState(0);
  // A fresh Attempt per try gives a new session and a new attempt Rng (fresh shuffle, same level content).
  return (
    <Attempt
      key={`${props.mode ?? ''}:${props.level}:${attempt}`}
      {...props}
      attempt={attempt}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

function Attempt({
  definition: def,
  level,
  mode,
  settings,
  history,
  clock,
  progress,
  log,
  countdownMs = 3_000,
  onNext,
  onMap,
  attempt,
  onRetry,
}: GameShellProps & { attempt: number; onRetry: () => void }) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const script = settings.script;

  const [run] = useState(() => {
    const spec = def.levels(levelContext(def.id, level, settings, history, mode));
    const rules = def.createRules(spec, createRng(seedFrom(`${spec.seed}:attempt:${attempt}`)));
    const session: Session<unknown, unknown, GameEvent> = createSession({
      rules,
      lives: spec.lives,
      countdownMs,
      clock,
    });
    const events: GameEvent[] = [];
    const scoring = def.scoringFor?.(spec, settings) ?? def.scoring;
    const multipliers = def.multipliers?.(settings, mode);
    const state = {
      lastAt: 0,
      outcome: undefined as Outcome | undefined,
      startedAt: 0,
      streak: 0,
      spec,
      events,
    };
    session.subscribe((e: SessionEvent<GameEvent>) => {
      if (e.type === 'phase' && 'phase' in e) {
        if (e.phase === 'playing') state.lastAt = e.at;
        if (e.phase === 'won' || e.phase === 'lost') finish(e.phase === 'won');
      } else {
        events.push(e);
        const entries = def.logEvents?.(spec, e, e.at - state.lastAt) ?? [];
        for (const entry of entries) log.log(entry);
        // Response time runs from the start of play, or from the previous answer.
        if (entries.some((x) => x.type === 'match_correct' || x.type === 'match_wrong'))
          state.lastAt = e.at;
        if (e.type === 'combo') state.streak++;
        if (e.type === 'mistake' || e.type === 'lifeLost') state.streak = 0;
      }
      rerender();
    });
    function finish(won: boolean) {
      const timeMs = session.getState().elapsedMs;
      const tally = tallyScoreInput(events);
      if (!won) {
        state.outcome = { won, score: 0, stars: 0, timeMs, ...tally, newBest: false };
        log.log({ type: 'level_failed', gameId: def.id, level });
        return;
      }
      const input = { timeMs, ...tally };
      const score = scoreOf({ ...input, multipliers }, scoring);
      const stars = starsOf(input, scoring);
      const { newBest } = recordWin(progress, level, { score, stars, timeMs });
      state.outcome = { won, score, stars, timeMs, ...tally, newBest };
      log.log({
        type: 'level_complete',
        gameId: def.id,
        score,
        timeMs,
        mistakes: tally.mistakes,
        hints: tally.hints,
      });
    }
    function begin() {
      state.startedAt = clock.now();
      log.log({ type: 'level_start', gameId: def.id, level });
      session.start();
    }
    return { session, state, begin, scoring, multipliers };
  });
  const { session, state, begin, scoring, multipliers } = run;

  useEffect(() => {
    if (session.getState().phase !== 'ready') return;
    begin();
    rerender();
  }, [session, begin]);

  const { phase } = session.getState();
  const moving = phase === 'countdown' || phase === 'playing';
  useEffect(() => {
    if (!moving) return;
    const id = setInterval(() => {
      session.tick();
      rerender();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [moving, session]);

  const s = session.getState();
  const t = (latn: string) => label(script, latn);

  if (s.phase === 'won' || s.phase === 'lost') {
    const o = state.outcome!;
    return (
      <ResultsScreen {...o} script={script} onNext={onNext} onReplay={onRetry} onMap={onMap} />
    );
  }

  if (s.phase === 'ready' || s.phase === 'countdown') {
    return (
      <Countdown
        script={script}
        remainingMs={Math.max(0, state.startedAt + countdownMs - clock.now())}
      />
    );
  }

  const { Board } = def;
  return (
    <div>
      <header>
        <LevelBadge level={level} script={script} />
        <Timer ms={s.elapsedMs} script={script} />
        <Lives lives={s.lives} max={state.spec.lives} script={script} />
        <Score
          value={scoreOf(
            { timeMs: s.elapsedMs, ...tallyScoreInput(state.events), multipliers },
            scoring,
          )}
          script={script}
        />
        <Combo count={state.streak} script={script} />
        <button type="button" onClick={() => session.pause()}>
          {t('Pauza')}
        </button>
      </header>
      {s.phase === 'paused' ? (
        <PauseOverlay script={script} onResume={() => session.resume()} onMap={onMap} />
      ) : (
        <Board
          spec={state.spec}
          settings={settings}
          state={s}
          dispatch={(a: unknown) => session.dispatch(a)}
          subscribe={session.subscribe as BoardProps<unknown, unknown, unknown>['subscribe']}
        />
      )}
    </div>
  );
}
