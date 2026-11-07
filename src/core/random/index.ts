/** Deterministic randomness: mulberry32 PRNG plus helpers. Never use Math.random in games or tests. */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
}

/** FNV-1a 32-bit hash of a string, for turning text (e.g. a daily key) into a seed. */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new RangeError(`int(${min}, ${max}): need integers with min <= max`);
      }
      return min + Math.floor(next() * (max - min + 1));
    },
  };
}

/** Fisher–Yates; returns a new array and leaves the input untouched. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** Up to `n` distinct elements (by position), in random order. */
export function sample<T>(rng: Rng, items: readonly T[], n: number): T[] {
  if (n < 0) throw new RangeError(`sample: n must be >= 0, got ${n}`);
  return shuffle(rng, items).slice(0, n);
}

/** Index-aligned weights; returns the chosen item. Zero-weight items are never picked. */
export function weightedPick<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  if (items.length === 0 || items.length !== weights.length) {
    throw new RangeError('weightedPick: need equal-length, non-empty items and weights');
  }
  let total = 0;
  for (const w of weights) {
    if (!(w >= 0) || !Number.isFinite(w)) throw new RangeError(`weightedPick: invalid weight ${w}`);
    total += w;
  }
  if (total <= 0) throw new RangeError('weightedPick: total weight must be positive');
  let r = rng.next() * total;
  let last = 0;
  for (let i = 0; i < items.length; i++) {
    const w = weights[i] as number;
    if (w <= 0) continue;
    last = i;
    if (r < w) return items[i] as T;
    r -= w;
  }
  return items[last] as T; // float rounding fallback: last positive-weight item
}
