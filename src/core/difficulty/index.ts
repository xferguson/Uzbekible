/** Level -> parameters via per-parameter curves, plus explicit special levels (breathers, hard pairs). */

export interface StepCurve {
  type: 'step';
  /** Value applies from `fromLevel` until the next step. Below the first step the first value is used. */
  steps: readonly { fromLevel: number; value: number }[];
  round?: boolean;
}

export interface LinearCurve {
  type: 'linear';
  fromLevel: number;
  toLevel: number;
  from: number;
  to: number;
  round?: boolean;
}

export interface LogisticCurve {
  type: 'logistic';
  min: number;
  max: number;
  /** Level at which the curve is half-way between min and max. */
  midpoint: number;
  steepness: number;
  round?: boolean;
}

export type Curve = StepCurve | LinearCurve | LogisticCurve;

export interface DifficultyConfig<K extends string = string> {
  params: Record<K, Curve>;
  /** Explicit per-level overrides; only the named params are replaced. */
  special?: Record<number, Partial<Record<K, number>>>;
}

function evaluate(curve: Curve, level: number): number {
  switch (curve.type) {
    case 'step': {
      if (curve.steps.length === 0) throw new RangeError('step curve needs at least one step');
      const sorted = [...curve.steps].sort((a, b) => a.fromLevel - b.fromLevel);
      let value = sorted[0]!.value;
      for (const s of sorted) if (s.fromLevel <= level) value = s.value;
      return value;
    }
    case 'linear': {
      if (curve.toLevel <= curve.fromLevel) return level >= curve.toLevel ? curve.to : curve.from;
      const t = Math.min(
        1,
        Math.max(0, (level - curve.fromLevel) / (curve.toLevel - curve.fromLevel)),
      );
      return curve.from + (curve.to - curve.from) * t;
    }
    case 'logistic': {
      const t = 1 / (1 + Math.exp(-curve.steepness * (level - curve.midpoint)));
      return curve.min + (curve.max - curve.min) * t;
    }
  }
}

export function paramsFor<K extends string>(
  level: number,
  config: DifficultyConfig<K>,
): Record<K, number> {
  if (!Number.isInteger(level)) throw new RangeError('level must be an integer');
  const out = {} as Record<K, number>;
  for (const key of Object.keys(config.params) as K[]) {
    const curve = config.params[key];
    const v = evaluate(curve, level);
    out[key] = curve.round ? Math.round(v) : v;
  }
  return { ...out, ...config.special?.[level] };
}
