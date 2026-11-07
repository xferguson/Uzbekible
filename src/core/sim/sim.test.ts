import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { simulate, PROFILES, type SimGame } from './sim.ts';

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

  it('averages the two middle values for an even number of runs; nothing completed gives null time', () => {
    const hopeless = {
      name: 'h',
      accuracy: { low: 0, high: 0 },
      responseMs: { median: 500, spread: 0 },
    };
    const rows = simulate({ ...base, profiles: [hopeless], levels: [1], runs: 2 });
    expect(rows[0]!.medianTimeMs).toBeNull();
  });
});

describe('scan time', () => {
  const scanner = {
    name: 'scanner',
    accuracy: { low: 1, high: 1 },
    responseMs: { median: 1000, spread: 0.3 },
    scanMsPerChoice: 100,
  };
  const withChoices = (choices: number | undefined): SimGame<S, A> => ({
    ...fake,
    nextStep: (s, l, r) => ({
      ...fake.nextStep(s, l, r),
      ...(choices === undefined ? {} : { choices }),
    }),
  });
  const medianTime = (choices: number | undefined, seed = 7) =>
    simulate({ ...base, game: withChoices(choices), profiles: [scanner], levels: [3], seed })[0]!
      .medianTimeMs!;

  it('takes strictly longer with 24 tiles on screen than with 2 (same seed)', () => {
    expect(medianTime(24)).toBeGreaterThan(medianTime(2));
  });

  it('adds exactly scanMsPerChoice per tile for a constant-time profile', () => {
    const flat = { ...scanner, responseMs: { median: 1000, spread: 0 } };
    const [row] = simulate({ ...base, game: withChoices(10), profiles: [flat], levels: [2] });
    expect(row!.medianTimeMs).toBe(2 * (1000 + 10 * 100));
  });

  it('is non-decreasing in choices for a fixed seed and profile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 40 }),
        fc.integer({ min: 0, max: 40 }),
        fc.integer(),
        (a, b, seed) => {
          const [lo, hi] = a <= b ? [a, b] : [b, a];
          expect(medianTime(hi, seed)).toBeGreaterThanOrEqual(medianTime(lo, seed));
        },
      ),
      { numRuns: 25 },
    );
  });

  it('leaves tables unchanged when choices is absent, even for profiles with a scan term', () => {
    const plain = { ...scanner, scanMsPerChoice: undefined };
    expect(simulate({ ...base, game: withChoices(undefined), profiles: [scanner] })).toEqual(
      simulate({ ...base, game: withChoices(undefined), profiles: [plain] }),
    );
  });

  it('defines a scan term on every built-in profile, growing as skill falls', () => {
    const scan = (n: string) => PROFILES[n]!.scanMsPerChoice!;
    expect(scan('expert')).toBeGreaterThan(0);
    expect(scan('novice')).toBeGreaterThan(scan('b1-turkish'));
    expect(scan('b1-turkish')).toBeGreaterThan(scan('expert'));
  });
});

describe('Juft-shaped game', () => {
  type JS = { matched: number };
  type JA = { pair: number; right: boolean };
  type JEvent = { type: 'pairMatched'; pair: number } | { type: 'tileShake' };
  const juft: SimGame<JS, JA> = {
    ...fake,
    id: 'juft-shaped',
    lives: () => 100,
    createRules: (level) => ({
      init: { matched: 0 },
      reduce: (s, a) => {
        if (!a.right) {
          const events: JEvent[] = [{ type: 'tileShake' }];
          return { state: s, events: [...events, { type: 'mistake' }, { type: 'lifeLost' }] };
        }
        const matched = s.matched + 1;
        return {
          state: { matched },
          events: [
            { type: 'pairMatched', pair: matched } as JEvent,
            { type: 'hint' },
            { type: 'combo' },
            ...(matched >= level ? [{ type: 'complete' as const }] : []),
          ],
        };
      },
    }),
    nextStep: (s, level) => ({
      transparency: 0.5,
      choices: 2 * (level - s.matched),
      correct: { pair: s.matched + 1, right: true },
      wrong: { pair: 0, right: false },
    }),
  };

  it('reports non-zero mistakes, hints and combos for a fallible bot', () => {
    const [row] = simulate({
      game: juft,
      profiles: ['novice'],
      levels: [6],
      runs: 30,
      seed: 3,
    });
    expect(row!.medianMistakes).toBeGreaterThan(0);
    expect(row!.medianHints).toBeGreaterThan(0);
    expect(row!.medianCombos).toBeGreaterThan(0);
  });
});
