/**
 * Imlo level generator: content + settings + mode + level number -> a deterministic LevelSpec of pairs to spell,
 * each with its shuffled letter bank. Content is injected (`createImloLevels(items)`); all randomness comes from
 * `ctx.rng`. A fresh shuffle per attempt is the rules' job (I3), not this generator's.
 */
import { boardPool, compareByFrequency, type Item, type SourceForm } from '@core/content/index.ts';
import { paramsFor, type DifficultyConfig } from '@core/difficulty/index.ts';
import { sample, shuffle, type Rng } from '@core/random/index.ts';
import { DEFAULT_REVIEW_RATIO, nextItems } from '@core/scheduler/index.ts';
import {
  foldApostrophes,
  latnToCyrl,
  sourceLetters,
  toLetters,
  type SourceLang,
  type TextLang,
  type UzScript,
} from '@core/text/index.ts';
import { chooseSource } from '../shared/source.ts';
import type { LevelContext, LevelSpec } from '../types.ts';
import { ALPHABETS, CONFUSABLES } from './confusables.ts';
import {
  LEVEL_COUNT,
  LIVES,
  MAX_LETTERS,
  MIN_LETTERS,
  imloDifficulty,
  type ImloParamKey,
} from './difficulty.config.ts';

export type ImloMode = 'oson' | 'orta' | 'qiyin';

export interface BankTile {
  /** Unique within its pair. */
  id: string;
  letter: string;
  origin: 'source' | 'uz' | 'distractor';
}

export interface ImloPair {
  itemId: string;
  /** The English meaning shown under the check star (the one allowed English on a board). */
  clue: string;
  source: { lang: SourceLang; text: string; letters: string[] };
  uz: { text: string; letters: string[] };
  bank: BankTile[];
}

export interface ImloParams {
  pairs: readonly ImloPair[];
  mode: ImloMode;
}

const DEFAULT_MODE: ImloMode = 'oson';
const MODES: readonly string[] = ['oson', 'orta', 'qiyin'];
const WORD_BREAK = /[\s\-‐-―]/u;

interface Candidate {
  item: Item;
  source: SourceForm;
  sourceLetters: string[];
  uzText: string;
  uzLetters: string[];
}

interface Range {
  min: number;
  max: number;
}

function uzScriptOf(script: 'latn' | 'cyrl'): UzScript {
  return script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn';
}

/** Items in a frequency window that moves along the pool as the level rises. */
function band<T>(pool: readonly T[], level: number, need: number): T[] {
  const span = Math.min(pool.length, Math.max(need * 4, Math.ceil(pool.length * 0.2)));
  const progress = Math.min(1, Math.max(0, (level - 1) / (LEVEL_COUNT - 1)));
  const start = Math.round(progress * (pool.length - span));
  return pool.slice(start, start + span);
}

export function createImloLevels(
  items: readonly Item[],
  config: DifficultyConfig<ImloParamKey> = imloDifficulty,
): (ctx: LevelContext) => LevelSpec<ImloParams> {
  const base = boardPool(items).sort(compareByFrequency);

  // Every real word per language, for the "never another valid spelling" distractor rule.
  const known: Partial<Record<TextLang, Set<string>>> = {};
  const knownWords = (lang: TextLang): Set<string> => {
    const have = known[lang];
    if (have) return have;
    const set = new Set<string>();
    for (const it of items) {
      if (lang === 'uz-Latn') set.add(toLetters(it.uz.latn, lang).join(''));
      else if (lang === 'uz-Cyrl') set.add(toLetters(it.uz.cyrl, lang).join(''));
      else
        for (const s of it.sources)
          if (s.lang === lang) set.add(sourceLetters(s.text, lang).join(''));
    }
    return (known[lang] = set);
  };

  /** Would adding `letter` let a player build another real word out of `word` (one insertion or swap)? */
  const makesOtherWord = (letter: string, word: readonly string[], lang: TextLang): boolean => {
    const words = knownWords(lang);
    const own = word.join('');
    for (let i = 0; i <= word.length; i++) {
      const inserted = word.toSpliced(i, 0, letter).join('');
      if (words.has(inserted) && inserted !== own) return true;
      if (i < word.length) {
        const swapped = word.with(i, letter).join('');
        if (words.has(swapped) && swapped !== own) return true;
      }
    }
    return false;
  };

  /** Sound-correspondence letters of a source form that are single tiles on both sides, source letter first. */
  const correspondenceLetters = (c: Candidate, script: UzScript): string[] => {
    const out: string[] = [];
    for (const rule of c.source.correspondence ?? []) {
      const [from, to] = rule.split('>');
      if (from === undefined || to === undefined) continue;
      const uz = script === 'uz-Cyrl' ? latnToCyrl(to) : to;
      if (ALPHABETS[c.source.lang].includes(from)) out.push(from);
      if (
        toLetters(uz, script).length === 1 &&
        ALPHABETS[script].includes(toLetters(uz, script)[0]!)
      )
        out.push(toLetters(uz, script)[0]!);
    }
    return out;
  };

  const distractorsFor = (c: Candidate, script: UzScript, count: number, rng: Rng): string[] => {
    const lang = c.source.lang;
    const confusable = [
      ...c.sourceLetters.flatMap((l) => CONFUSABLES[lang][l] ?? []),
      ...c.uzLetters.flatMap((l) => CONFUSABLES[script][l] ?? []),
    ];
    const candidates = [
      ...correspondenceLetters(c, script),
      ...confusable,
      ...shuffle(rng, ALPHABETS[lang]),
      ...shuffle(rng, ALPHABETS[script]),
    ];
    const picked: string[] = [];
    for (const letter of candidates) {
      if (picked.length >= count) break;
      if (picked.includes(letter)) continue;
      if (makesOtherWord(letter, c.sourceLetters, lang)) continue;
      if (makesOtherWord(letter, c.uzLetters, script)) continue;
      picked.push(letter);
    }
    return picked;
  };

  return (ctx) => {
    const { level, history, rng } = ctx;
    if (!Number.isInteger(level) || level < 1) throw new RangeError(`invalid level ${level}`);
    if (ctx.settings.sourceLangs.length === 0) throw new RangeError('at least one source language');
    const mode = (ctx.mode ?? DEFAULT_MODE) as ImloMode;
    if (!MODES.includes(mode)) throw new RangeError(`unknown Imlo mode ${mode}`);
    const script = uzScriptOf(ctx.settings.script);
    const langs = new Set<SourceLang>(ctx.settings.sourceLangs);
    const p = paramsFor(level, config);
    const n = Math.max(1, p.pairs);
    const strict: Range = {
      min: Math.max(MIN_LETTERS, p.minLetters),
      max: Math.min(MAX_LETTERS, p.maxLetters),
    };
    const relaxed: Range = { min: MIN_LETTERS, max: MAX_LETTERS };
    const opts = { enabledLangs: ctx.settings.sourceLangs };

    /** The pair an item gives under a letter range, or null when it cannot be spelled as a pair. */
    const candidate = (item: Item, range: Range): Candidate | null => {
      const uzText = script === 'uz-Cyrl' ? item.uz.cyrl : item.uz.latn;
      const uzLetters = toLetters(uzText, script);
      const fits = (letters: readonly string[]) =>
        letters.length >= range.min && letters.length <= range.max;
      if (WORD_BREAK.test(uzText) || !fits(uzLetters)) return null;
      const accept = (s: SourceForm): boolean => {
        if (WORD_BREAK.test(s.text)) return false;
        const letters = sourceLetters(s.text, s.lang);
        if (!fits(letters)) return false;
        return (
          foldApostrophes(letters.join('')) !== foldApostrophes(uzLetters.join('').toLowerCase())
        );
      };
      const usable = item.sources.some(
        (s) => langs.has(s.lang) && s.relation !== 'false-friend' && accept(s),
      );
      if (!usable) return null;
      const source = chooseSource(item, langs, rng, accept);
      return {
        item,
        source,
        sourceLetters: sourceLetters(source.text, source.lang),
        uzText,
        uzLetters,
      };
    };

    const tier = (range: Range): Map<string, Candidate> => {
      const found = new Map<string, Candidate>();
      for (const item of base) {
        const c = candidate(item, range);
        if (c) found.set(item.id, c);
      }
      return found;
    };

    const strictPool = tier(strict);
    const chosen: Candidate[] = [];
    const used = new Set<string>();
    const add = (c: Candidate | undefined): boolean => {
      if (!c || chosen.length >= n || used.has(c.item.id)) return false;
      const keys = [`uz:${c.uzText}`, `src:${c.source.text}`];
      if (keys.some((k) => used.has(k))) return false;
      used.add(c.item.id);
      for (const k of keys) used.add(k);
      chosen.push(c);
      return true;
    };
    const itemsOf = (pool: Map<string, Candidate>, skipUsed = true): Item[] =>
      [...pool.values()].map((c) => c.item).filter((it) => !skipUsed || !used.has(it.id));

    // 1. Re-show missed items first (the scheduler weights the worst known highest).
    const missed = new Set(history.filter((a) => a.correct < a.attempts).map((a) => a.itemId));
    const reviewable = itemsOf(strictPool).filter((it) => missed.has(it.id));
    const reviewSlots = Math.round(n * DEFAULT_REVIEW_RATIO);
    for (const it of nextItems(reviewable, history, reviewSlots, rng, { ...opts, reviewRatio: 1 }))
      add(strictPool.get(it.id));

    // 2. New items from a frequency window that moves along the pool with the level.
    const windowed = band(itemsOf(strictPool), level, n - chosen.length);
    for (const it of sample(rng, windowed, windowed.length)) add(strictPool.get(it.id));

    // 3. Still short: anything in range, then the widest range, scheduler-ordered.
    if (chosen.length < n) {
      const rest = itemsOf(strictPool);
      for (const it of nextItems(rest, history, rest.length, rng, opts)) add(strictPool.get(it.id));
    }
    if (chosen.length < n) {
      const wide = tier(relaxed);
      const rest = itemsOf(wide);
      for (const it of nextItems(rest, history, rest.length, rng, opts)) add(wide.get(it.id));
    }

    const distractorCount = mode === 'qiyin' ? Math.max(0, p.distractors) : 0;
    const pairs: ImloPair[] = chosen.map((c) => {
      const extra = distractorCount > 0 ? distractorsFor(c, script, distractorCount, rng) : [];
      const tiles: BankTile[] = [
        ...c.sourceLetters.map((letter, i) => ({ id: `s${i}`, letter, origin: 'source' as const })),
        ...c.uzLetters.map((letter, i) => ({ id: `u${i}`, letter, origin: 'uz' as const })),
        ...extra.map((letter, i) => ({ id: `d${i}`, letter, origin: 'distractor' as const })),
      ];
      return {
        itemId: c.item.id,
        clue: c.item.glossEn,
        source: { lang: c.source.lang, text: c.source.text, letters: c.sourceLetters },
        uz: { text: c.uzText, letters: c.uzLetters },
        bank: shuffle(rng, tiles),
      };
    });

    return { level, seed: ctx.seed, lives: LIVES, params: { pairs, mode } };
  };
}
