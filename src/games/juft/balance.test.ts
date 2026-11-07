import { describe, expect, it } from 'vitest';
import { simulate } from '../../core/sim/index.ts';
import {
  isHardPair,
  juftSimDefinition,
  juftSimGame,
  MAX_PAIRS,
  pairsForLevel,
  transparencyForLevel,
} from './balance.ts';

describe('juft balance harness', () => {
  it('follows the level curve: 1 pair at the start, 12 in Registon, never above 12', () => {
    expect(pairsForLevel(1)).toBe(1);
    for (let l = 106; l <= 120; l++) expect(pairsForLevel(l)).toBe(isHardPair(l) ? 1 : MAX_PAIRS);
    for (let l = 1; l <= 300; l++) expect(pairsForLevel(l)).toBeLessThanOrEqual(MAX_PAIRS);
    expect(pairsForLevel(30)).toBe(1);
  });

  it('keeps transparency in 0..1 and builds the definition at the level size', () => {
    for (let l = 1; l <= 150; l++) {
      expect(transparencyForLevel(l)).toBeGreaterThan(0);
      expect(transparencyForLevel(l)).toBeLessThanOrEqual(1);
    }
    const spec = juftSimDefinition(112).levels({
      level: 112,
      settings: { sourceLangs: ['tr'], script: 'latn' },
      history: [],
      seed: 's',
      rng: { next: () => 0 } as never,
    });
    expect(spec.params.pairIds).toHaveLength(12);
  });

  it('simulates deterministically and models scan time on big boards', () => {
    const run = (level: number, profile: string) =>
      simulate({
        game: juftSimGame(level),
        profiles: [profile],
        levels: [level],
        runs: 40,
        seed: 3,
      })[0]!;
    expect(run(111, 'b1-turkish')).toEqual(run(111, 'b1-turkish'));
    const small = run(11, 'expert').medianTimeMs!;
    const big = run(111, 'expert').medianTimeMs!;
    expect(big / pairsForLevel(111)).toBeGreaterThan(small / pairsForLevel(11));
  });
});
