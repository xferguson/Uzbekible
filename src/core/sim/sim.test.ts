import { describe, expect, it } from 'vitest';
import { formatTable, parseArgs, runCli, simulate, PROFILES, type SimGame } from './sim.ts';

/** Trivial game: `level` items, each wrong answer costs a life. Items are fully transparent unless level > 3. */
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
  nextStep: (_s, level) => ({
    transparency: level > 3 ? 0 : 1,
    correct: { type: 'answer', correct: true },
    wrong: { type: 'answer', correct: false },
  }),
};

const base = { game: fake, profiles: ['expert'], levels: [1, 2], runs: 20, seed: 7 };

describe('simulate', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = simulate({ ...base, profiles: ['novice'], levels: [5] });
    expect(simulate({ ...base, profiles: ['novice'], levels: [5] })).toEqual(a);
    const b = simulate({ ...base, profiles: ['novice'], levels: [5], seed: 8 });
    expect(b).not.toEqual(a);
  });

  it('gives a perfect bot a 100% completion rate and consistent stats on a trivial game', () => {
    const perfect = {
      ...PROFILES.expert!,
      accuracy: { low: 1, high: 1 },
      responseMs: { median: 1000, spread: 0 },
    };
    const rows = simulate({ ...base, profiles: [perfect] });
    expect(rows).toHaveLength(2);
    const r2 = rows[1]!;
    expect(r2).toMatchObject({
      level: 2,
      profile: 'expert',
      runs: 20,
      completionRate: 1,
      medianTimeMs: 2000,
    });
    expect(r2.medianScore).toBe(1000 + 20); // base + 2 combos
    expect(r2.stars).toEqual([0, 0, 0, 20]);
  });

  it('never completes when accuracy is 0 and counts the runs as lost', () => {
    const hopeless = {
      name: 'hopeless',
      accuracy: { low: 0, high: 0 },
      responseMs: { median: 500, spread: 0 },
    };
    const [row] = simulate({ ...base, profiles: [hopeless], levels: [1] });
    expect(row).toMatchObject({ completionRate: 0, medianScore: 0, stars: [20, 0, 0, 0] });
  });

  it('lowers completion for harder (low-transparency) levels with weaker profiles', () => {
    const rows = simulate({ ...base, profiles: ['novice', 'expert'], levels: [2, 6], runs: 100 });
    const rate = (p: string, l: number) =>
      rows.find((r) => r.profile === p && r.level === l)!.completionRate;
    expect(rate('expert', 6)).toBeGreaterThanOrEqual(rate('novice', 6));
    expect(rate('novice', 2)).toBeGreaterThan(rate('novice', 6));
  });

  it('treats a bot that exceeds maxActions as not completed', () => {
    const [row] = simulate({ ...base, levels: [50], maxActions: 3 });
    expect(row!.completionRate).toBe(0);
  });

  it('rejects unknown profiles and bad run counts', () => {
    expect(() => simulate({ ...base, profiles: ['nope'] })).toThrow(/profile/);
    expect(() => simulate({ ...base, runs: 0 })).toThrow(RangeError);
  });

  it('defines the three required profiles with accuracy rising with skill', () => {
    const acc = (n: string) => PROFILES[n]!.accuracy;
    expect(Object.keys(PROFILES)).toEqual(['novice', 'b1-turkish', 'expert']);
    expect(acc('novice').high).toBeLessThan(acc('expert').high);
    expect(acc('b1-turkish').low).toBeGreaterThan(acc('novice').low);
  });
});

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

describe('edge cases', () => {
  it('tallies hint events as score penalties', () => {
    const hinting: SimGame<S, A> = {
      ...fake,
      createRules: (level) => {
        const r = fake.createRules(level);
        return {
          ...r,
          reduce: (s, a) => {
            const out = r.reduce(s, a);
            return { ...out, events: [{ type: 'hint' }, ...out.events] };
          },
        };
      },
    };
    const perfect = {
      name: 'p',
      accuracy: { low: 1, high: 1 },
      responseMs: { median: 1000, spread: 0 },
    };
    const [plain] = simulate({ ...base, profiles: [perfect], levels: [1] });
    const [hinted] = simulate({ ...base, game: hinting, profiles: [perfect], levels: [1] });
    expect(hinted!.medianScore).toBe(plain!.medianScore - 50);
  });

  it('averages the two middle values for an even number of runs and shows "–" when nothing completed', () => {
    const hopeless = {
      name: 'h',
      accuracy: { low: 0, high: 0 },
      responseMs: { median: 500, spread: 0 },
    };
    const rows = simulate({ ...base, profiles: [hopeless], levels: [1], runs: 2 });
    expect(rows[0]!.medianTimeMs).toBeNull();
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
