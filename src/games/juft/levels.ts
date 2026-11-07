/**
 * Juft level generator: content + settings + level number -> a deterministic LevelSpec.
 * Content is injected (`createJuftLevels(items)`) so the generator stays pure and testable; the game definition
 * wires in the loaded pack. All randomness comes from `ctx.rng`.
 */
import {
  boardPool,
  compareByFrequency,
  type Confidence,
  type Item,
  type SourceForm,
} from '@core/content/index.ts';
import { paramsFor, type DifficultyConfig } from '@core/difficulty/index.ts';
import { sample } from '@core/random/index.ts';
import { DEFAULT_REVIEW_RATIO, nextItems } from '@core/scheduler/index.ts';
import type { SourceLang } from '@core/text/index.ts';
import type { LevelContext, LevelSpec } from '../types.ts';
import { CHAPTER_SIZE, MAX_PAIRS, juftDifficulty, type JuftParamKey } from './difficulty.config.ts';

export interface JuftPair {
  /** The item id; both tiles of the pair share it. */
  id: string;
  source: { lang: SourceLang; text: string; relation: SourceForm['relation'] };
  uz: { latn: string; cyrl: string };
  glossEn: string;
  /** Transparency of the chosen source form, 0..1 (neutral when the content has no score). */
  transparency: number;
  /** An inflected (suffixed) form rather than a lemma. */
  suffixed: boolean;
}

export interface JuftParams {
  pairs: readonly JuftPair[];
  parMs: number;
  /** A one-pair "hard pair" breather. */
  hard: boolean;
  chapter: number;
}

/** Score used for source forms the content build does not score (only Turkish is scored). */
const NEUTRAL_TRANSPARENCY = 0.5;
const HARD_MAX_TRANSPARENCY = 0.5;
const HARD_WINDOW = 4;
const LIVES = 3;
/** Level at which the frequency window reaches the end of the pool. */
const PROGRESS_LEVELS = 105;
const LANG_ORDER: readonly SourceLang[] = ['tr', 'fa', 'ru', 'ar'];
const CONFIDENCE_RANK: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };

function bestOf(forms: readonly SourceForm[]): SourceForm {
  return [...forms].sort(
    (a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence],
  )[0]!;
}

/** One source form among the enabled languages: Turkish when there is one, else a random enabled language. */
function chooseSource(
  item: Item,
  langs: ReadonlySet<SourceLang>,
  rng: LevelContext['rng'],
): SourceForm {
  const usable = item.sources.filter((s) => langs.has(s.lang) && s.relation !== 'false-friend');
  const tr = usable.filter((s) => s.lang === 'tr');
  if (tr.length > 0) return bestOf(tr);
  const present = LANG_ORDER.filter((l) => usable.some((s) => s.lang === l));
  const lang = present.length === 1 ? present[0]! : present[rng.int(0, present.length - 1)]!;
  return bestOf(usable.filter((s) => s.lang === lang));
}

function transparencyOf(item: Item, langs: ReadonlySet<SourceLang>): number {
  const scores = [...langs]
    .map((l) => item.transparency?.[l])
    .filter((v): v is number => v !== undefined);
  return scores.length > 0 ? Math.max(...scores) : NEUTRAL_TRANSPARENCY;
}

/** Items in a frequency window that moves along the pool as the level rises. */
function band(pool: readonly Item[], level: number, need: number): Item[] {
  const span = Math.min(pool.length, Math.max(need * 4, Math.ceil(pool.length * 0.2)));
  const progress = Math.min(1, Math.max(0, (level - 1) / (PROGRESS_LEVELS - 1)));
  const start = Math.round(progress * (pool.length - span));
  return pool.slice(start, start + span);
}

export function createJuftLevels(
  items: readonly Item[],
  config: DifficultyConfig<JuftParamKey> = juftDifficulty,
): (ctx: LevelContext) => LevelSpec<JuftParams> {
  const base = boardPool(items).sort(compareByFrequency);
  const hardLevels = Object.entries(config.special ?? {})
    .filter(([, v]) => v.hard === 1)
    .map(([l]) => Number(l))
    .sort((a, b) => a - b);

  return (ctx) => {
    const { level, history, rng } = ctx;
    if (!Number.isInteger(level) || level < 1) throw new RangeError(`invalid level ${level}`);
    if (ctx.settings.sourceLangs.length === 0) throw new RangeError('at least one source language');
    const langs = new Set<SourceLang>(ctx.settings.sourceLangs);
    const p = paramsFor(level, config);
    const n = Math.min(MAX_PAIRS, Math.max(1, p.pairs));
    const hard = p.hard === 1;

    const eligible = base.filter((it) => it.sources.some((s) => langs.has(s.lang)));
    const opts = { enabledLangs: ctx.settings.sourceLangs };

    // Distinct tiles: no two pairs may share an item, an Uzbek form or a source form.
    const used = new Set<string>();
    const chosen: { item: Item; source: SourceForm }[] = [];
    const add = (item: Item): boolean => {
      if (chosen.length >= n || used.has(item.id)) return false;
      const source = chooseSource(item, langs, rng);
      const keys = [`uz:${item.uz.latn}`, `uz:${item.uz.cyrl}`, `src:${source.text}`];
      if (keys.some((k) => used.has(k))) return false;
      used.add(item.id);
      for (const k of keys) used.add(k);
      chosen.push({ item, source });
      return true;
    };

    if (hard) {
      const hardPool = eligible.filter(
        (it) =>
          it.form === 'lemma' &&
          (it.transparency?.tr ?? 1) <= HARD_MAX_TRANSPARENCY &&
          langs.has('tr'),
      );
      if (hardPool.length > 0) {
        const index = hardLevels.filter((l) => l < level).length % hardPool.length;
        const window = hardPool.slice(index, index + HARD_WINDOW);
        for (const it of nextItems(window, history, 1, rng, opts)) add(it);
      }
    } else {
      const minT = p.minTransparency;
      const suffixedWanted = Math.min(n, Math.round(p.suffixedShare * n));
      const quota = { inflected: suffixedWanted, lemma: n - suffixedWanted };
      const open = (it: Item): boolean => quota[it.form] > 0;
      const take = (it: Item): void => {
        if (open(it) && add(it)) quota[it.form]--;
      };

      // 1. Re-show missed items first (the scheduler weights the worst known highest).
      const missed = new Set(history.filter((a) => a.correct < a.attempts).map((a) => a.itemId));
      const reviewable = eligible.filter((it) => missed.has(it.id));
      const reviewSlots = Math.round(n * DEFAULT_REVIEW_RATIO);
      for (const it of nextItems(reviewable, history, reviewSlots, rng, {
        ...opts,
        reviewRatio: 1,
      }))
        take(it);

      // 2. New items for each form, from a frequency window of items that are transparent enough.
      for (const form of ['lemma', 'inflected'] as const) {
        const pool = eligible.filter((it) => it.form === form && transparencyOf(it, langs) >= minT);
        const windowed = band(pool, level, quota[form]).filter((it) => !used.has(it.id));
        for (const it of sample(rng, windowed, quota[form])) take(it);
        for (const it of pool) take(it);
      }
    }

    // 3. Still short (a small language set, a thin form): fill from the scheduler over everything eligible.
    if (chosen.length < n) {
      const rest = eligible.filter((it) => !used.has(it.id));
      for (const it of nextItems(rest, history, rest.length, rng, opts)) add(it);
    }

    const pairs: JuftPair[] = chosen.map(({ item, source }) => ({
      id: item.id,
      source: { lang: source.lang, text: source.text, relation: source.relation },
      uz: { latn: item.uz.latn, cyrl: item.uz.cyrl },
      glossEn: item.glossEn,
      transparency: item.transparency?.[source.lang] ?? NEUTRAL_TRANSPARENCY,
      suffixed: item.form === 'inflected',
    }));
    return {
      level,
      seed: ctx.seed,
      lives: LIVES,
      params: {
        pairs,
        parMs: Math.round(pairs.length * p.parPerPairMs),
        hard,
        chapter: Math.min(8, Math.ceil(level / CHAPTER_SIZE)),
      },
    };
  };
}
