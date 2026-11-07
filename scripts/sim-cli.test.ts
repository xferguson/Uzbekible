import { describe, expect, it } from 'vitest';
import { simulate, type SimGame } from '../src/core/sim/index.ts';
import { formatTable, parseArgs, runCli } from './sim-cli.ts';

type S = { done: number };
type A = { type: 'answer'; correct: boolean };
const fake: SimGame<S, A> = {
  id: 'fake',
  scoring: {
    basePoints: 1000,
    parMs: 10_000,
    overrunFactor: 3,
    mistakePenalty: 100,
    hintPenalty: 50,
    comboBonus: 10,
    starThresholds: [100, 500, 900],
  },
  lives: () => 3,
  countdownMs: 0,
  createRules: (level) => ({
    init: { done: 0 },
    reduce: (s, a) => {
      if (!a.correct) return { state: s, events: [{ type: 'mistake' }, { type: 'lifeLost' }] };
      const done = s.done + 1;
      return {
        state: { done },
        events: [{ type: 'combo' }, ...(done >= level ? [{ type: 'complete' }] : [])],
      };
    },
  }),
  nextStep: () => ({
    transparency: 1,
    correct: { type: 'answer', correct: true },
    wrong: { type: 'answer', correct: false },
  }),
};
const base = { game: fake, profiles: ['expert'], levels: [1, 2], runs: 20, seed: 7 };

describe('formatTable', () => {
  it('prints a markdown table with one row per result', () => {
    const md = formatTable(simulate(base));
    const lines = md.trim().split('\n');
    expect(lines[0]).toMatch(/^\| Level \| Profile \| Runs \| Completion/);
    expect(lines[1]).toMatch(/^\|[ -:|]+\|$/);
    expect(lines).toHaveLength(2 + 2);
  });
});

describe('cli', () => {
  it('parses flags with ranges and lists', () => {
    expect(
      parseArgs([
        '--game',
        'demo',
        '--levels',
        '2-4',
        '--profiles',
        'novice,expert',
        '--runs',
        '10',
        '--seed',
        '3',
      ]),
    ).toEqual({
      game: 'demo',
      levels: [2, 3, 4],
      profiles: ['novice', 'expert'],
      runs: 10,
      seed: 3,
    });
  });
  it('applies defaults', () => {
    expect(parseArgs(['--game', 'demo'])).toEqual({
      game: 'demo',
      levels: [1, 2, 3, 4, 5],
      profiles: ['novice', 'b1-turkish', 'expert'],
      runs: 100,
      seed: 1,
    });
  });
  it('rejects missing game and malformed values', () => {
    expect(() => parseArgs([])).toThrow(/--game/);
    expect(() => parseArgs(['--game', 'x', '--levels', '5-2'])).toThrow(/levels/);
    expect(() => parseArgs(['--game', 'x', '--runs', 'abc'])).toThrow(/runs/);
    expect(() => parseArgs(['--game', 'x', '--bogus', '1'])).toThrow(/--bogus/);
  });
  it('runs a registered game and errors for unknown ones', () => {
    const out = runCli(['--game', 'fake', '--levels', '1-2', '--runs', '5'], {
      fake: fake as SimGame<unknown, unknown>,
    });
    expect(out).toContain('| Level |');
    expect(() => runCli(['--game', 'zzz'], { fake: fake as SimGame<unknown, unknown> })).toThrow(
      /Unknown game "zzz".*fake/,
    );
  });
});

describe('cli edge cases', () => {
  it('shows "–" when nothing completed', () => {
    const hopeless = {
      name: 'h',
      accuracy: { low: 0, high: 0 },
      responseMs: { median: 500, spread: 0 },
    };
    const rows = simulate({ ...base, profiles: [hopeless], levels: [1], runs: 2 });
    expect(formatTable(rows)).toContain('| – |');
  });

  it('parses a single level and rejects a flag without a value or a non-numeric level', () => {
    expect(parseArgs(['--game', 'x', '--levels', '3']).levels).toEqual([3]);
    expect(() => parseArgs(['--game'])).toThrow(/missing value/);
    expect(() => parseArgs(['--game', 'x', '--levels', 'abc'])).toThrow(/levels/);
  });

  it('names (none) when no games are registered', () => {
    expect(() => runCli(['--game', 'x'], {})).toThrow(/\(none\)/);
  });
});
