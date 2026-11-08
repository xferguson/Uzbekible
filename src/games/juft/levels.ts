/**
 * Juft level generator: content + settings + level number -> a deterministic LevelSpec.
 * Content is injected (`createJuftLevels(items)`) so the generator stays pure and testable; the game definition
 * wires in the loaded pack. All randomness comes from `ctx.rng`.
 */
import { boardPool, compareByFrequency, type Item, type SourceForm } from '@core/content/index.ts';
import { paramsFor, type DifficultyConfig } from '@core/difficulty/index.ts';
import { sample, shuffle, type Rng } from '@core/random/index.ts';
import { letterDistance, lettersOf } from '@core/similarity/index.ts';
import { DEFAULT_REVIEW_RATIO, nextItems } from '@core/scheduler/index.ts';
import type { SourceLang } from '@core/text/index.ts';
import { chooseSource } from '../shared/source.ts';
import type { LevelContext, LevelSpec } from '../types.ts';
import {
  CHAPTER_SIZE,
  MAX_PAIRS,
  focusFor,
  juftDifficulty,
  type JuftFocus,
  type JuftParamKey,
} from './difficulty.config.ts';

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
  /** What the board is built around: a usual mix, look-alike spellings or one stem's suffixes. */
  focus: JuftFocus;
  chapter: number;
}

/** Score used for source forms the content build does not score (only Turkish is scored). */
const NEUTRAL_TRANSPARENCY = 0.5;
const HARD_MAX_TRANSPARENCY = 0.5;
const HARD_WINDOW = 4;
const LIVES = 3;
/** Seeds tried when looking for a tight look-alike cluster. */
const LOOKALIKE_SEEDS = 6;
/** Fewest forms a stem needs to anchor a family board (smaller boards need fewer). */
const FAMILY_MIN_FORMS = 4;

function sourceText(item: Item, langs: ReadonlySet<SourceLang>): string {
  return (item.sources.find((s) => langs.has(s.lang)) ?? item.sources[0])?.text ?? item.uz.latn;
}

const letterCache = new Map<string, string[]>();
function letters(text: string): string[] {
  let l = letterCache.get(text);
  if (!l) letterCache.set(text, (l = lettersOf(text)));
  return l;
}

/** How alike two items look: Uzbek spelling plus the source word's spelling (lower is more alike). */
function likeness(a: Item, b: Item, langs: ReadonlySet<SourceLang>): number {
  return (
    letterDistance(letters(a.uz.latn), letters(b.uz.latn)) +
    letterDistance(letters(sourceText(a, langs)), letters(sourceText(b, langs)))
  );
}

/** The best of a few random seeds: the seed plus its `n - 1` nearest neighbours, with the smallest total distance. */
function lookalikeCluster(
  pool: readonly Item[],
  n: number,
  langs: ReadonlySet<SourceLang>,
  rng: Rng,
): Item[] {
  let best: { total: number; cluster: Item[] } | undefined;
  for (const seed of sample(rng, pool, LOOKALIKE_SEEDS)) {
    const near = pool
      .filter((it) => it.id !== seed.id)
      .map((it) => ({ it, d: likeness(seed, it, langs) }))
      .sort((a, b) => a.d - b.d || a.it.id.localeCompare(b.it.id))
      .slice(0, n - 1);
    const total = near.reduce((sum, x) => sum + x.d, 0);
    if (!best || total < best.total) best = { total, cluster: [seed, ...near.map((x) => x.it)] };
  }
  return best?.cluster ?? [];
}

/** One stem at a time: the stem's own item first, then its suffixed forms in random order, until the board is full. */
function suffixFamilies(pool: readonly Item[], n: number, rng: Rng): Item[] {
  const forms = new Map<string, Item[]>();
  for (const it of pool)
    if (it.form === 'inflected' && it.lemma)
      forms.set(it.lemma, [...(forms.get(it.lemma) ?? []), it]);
  const byId = new Map(pool.map((it) => [it.id, it]));
  const stems = [...forms.keys()]
    .sort()
    .filter((l) => forms.get(l)!.length >= Math.min(n, FAMILY_MIN_FORMS));
  const out: Item[] = [];
  for (const stem of shuffle(rng, stems)) {
    const own = byId.get(stem);
    out.push(
      ...[...(own ? [own] : []), ...shuffle(rng, forms.get(stem)!)].slice(0, n - out.length),
    );
    if (out.length >= n) break;
  }
  return out;
}
/** Level at which the frequency window reaches the end of the pool. */
const PROGRESS_LEVELS = 105;

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
    const focus = hard ? 'mixed' : focusFor(level);

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
    } else if (focus === 'lookalike') {
      const pool = eligible.filter(
        (it) => it.form === 'lemma' && transparencyOf(it, langs) >= p.minTransparency,
      );
      for (const it of lookalikeCluster(pool, n, langs, rng)) add(it);
    } else if (focus === 'family') {
      for (const it of suffixFamilies(eligible, n, rng)) add(it);
    }

    if (!hard && focus === 'mixed') {
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
        focus,
        chapter: Math.min(8, Math.ceil(level / CHAPTER_SIZE)),
      },
    };
  };
}
