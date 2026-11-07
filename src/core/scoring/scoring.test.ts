import { describe, expect, it } from 'vitest';
import { score, stars, starsForScore, type ScoreInput, type ScoringConfig } from './index.ts';

const config: ScoringConfig = {
  basePoints: 1000,
  parMs: 60_000,
  overrunFactor: 3,
  mistakePenalty: 100,
  hintPenalty: 150,
  comboBonus: 10,
  starThresholds: [300, 600, 900],
};

const clean: ScoreInput = { timeMs: 60_000, mistakes: 0, hints: 0, combos: 0 };

describe('score', () => {
  it('awards full base points at or under par', () => {
    expect(score(clean, config)).toBe(1000);
    expect(score({ ...clean, timeMs: 0 }, config)).toBe(1000);
  });

  it('decays linearly from par to zero at par * overrunFactor', () => {
    expect(score({ ...clean, timeMs: 90_000 }, config)).toBe(750);
    expect(score({ ...clean, timeMs: 120_000 }, config)).toBe(500);
    expect(score({ ...clean, timeMs: 180_000 }, config)).toBe(0);
    expect(score({ ...clean, timeMs: 999_999 }, config)).toBe(0);
  });

  it('subtracts mistake and hint penalties', () => {
    expect(score({ ...clean, mistakes: 2 }, config)).toBe(800);
    expect(score({ ...clean, hints: 1 }, config)).toBe(850);
  });

  it('adds the combo bonus', () => {
    expect(score({ ...clean, combos: 5 }, config)).toBe(1050);
  });

  it('applies multipliers after penalties and bonuses', () => {
    expect(score({ ...clean, mistakes: 1, multipliers: [2] }, config)).toBe(1800);
    expect(score({ ...clean, multipliers: [1.5, 2] }, config)).toBe(3000);
  });

  it('floors at 0 and rounds to an integer', () => {
    expect(score({ ...clean, mistakes: 50 }, config)).toBe(0);
    expect(score({ ...clean, timeMs: 61_001 }, config)).toBe(992);
    expect(score({ ...clean, multipliers: [-3] }, config)).toBe(0);
  });

  it('treats a non-positive par time as an instant deadline without dividing by zero', () => {
    const c = { ...config, parMs: 0 };
    expect(score({ ...clean, timeMs: 0 }, c)).toBe(1000);
    expect(score({ ...clean, timeMs: 1 }, c)).toBe(0);
  });

  it('rejects invalid input and config', () => {
    expect(() => score({ ...clean, timeMs: -1 }, config)).toThrow(RangeError);
    expect(() => score({ ...clean, mistakes: Number.NaN }, config)).toThrow(RangeError);
    expect(() => score(clean, { ...config, overrunFactor: 1 })).toThrow(RangeError);
  });
});

describe('stars', () => {
  it('maps score to 0-3 by thresholds (inclusive)', () => {
    expect(starsForScore(0, config.starThresholds)).toBe(0);
    expect(starsForScore(299, config.starThresholds)).toBe(0);
    expect(starsForScore(300, config.starThresholds)).toBe(1);
    expect(starsForScore(600, config.starThresholds)).toBe(2);
    expect(starsForScore(900, config.starThresholds)).toBe(3);
  });

  it('derives stars from a result via score', () => {
    expect(stars(clean, config)).toBe(3);
    expect(stars({ ...clean, mistakes: 3 }, config)).toBe(2);
    expect(stars({ ...clean, timeMs: 180_000 }, config)).toBe(0);
  });

  it('rejects thresholds that are not ascending', () => {
    expect(() => stars(clean, { ...config, starThresholds: [600, 300, 900] })).toThrow(RangeError);
  });
});
