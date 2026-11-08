/**
 * The Imlo `GameDefinition`: wires the level generator, spelling rules, scoring, difficulty and board into the
 * shared shell contract. Content is injected so the definition can be built once the item pack has loaded.
 */
import type { Item } from '@core/content/index.ts';
import type { LogEventInput } from '@core/learning-log/index.ts';
import type { GameEvent } from '@core/session/index.ts';
import { registerGame } from '../registry.ts';
import type { GameDefinition, LevelSpec } from '../types.ts';
import { Board } from './Board.tsx';
import { CHAPTER_SIZE, imloDifficulty } from './difficulty.config.ts';
import { createImloLevels, type ImloParams } from './levels.ts';
import { createImloRules, type ImloAction, type ImloEvent, type ImloState } from './rules.ts';
import { imloMultipliers, imloScoring, scoringFor } from './scoring.config.ts';

/** The four buildings of the level map, in order (docs/games/06-imlo.md, decision 12). */
const CHAPTERS = ['Madrasa', 'Masjid', 'Minora', 'Registon'];

export type ImloDefinition = GameDefinition<ImloParams, ImloState, ImloAction, ImloEvent>;

export function createImloDefinition(items: readonly Item[]): ImloDefinition {
  const levels = createImloLevels(items);

  function logEvents(spec: LevelSpec<ImloParams>, event: GameEvent, rtMs: number): LogEventInput[] {
    const e = event as ImloEvent;
    if (e.type !== 'spellCorrect' && e.type !== 'spellWrong' && e.type !== 'hintUsed') return [];
    const pair = spec.params.pairs.find((p) => p.itemId === e.itemId);
    if (!pair) return [];
    if (e.type === 'spellCorrect')
      return [
        {
          type: 'spell_correct',
          gameId: 'imlo',
          itemId: e.itemId,
          sourceLang: pair.source.lang,
          rtMs,
          checks: e.checks,
          hints: e.hints,
        },
      ];
    if (e.type === 'spellWrong')
      return [
        {
          type: 'spell_wrong',
          gameId: 'imlo',
          itemId: e.itemId,
          sourceLang: pair.source.lang,
          side: e.side,
          given: e.given,
          expected: e.expected,
          rtMs,
        },
      ];
    return [{ type: 'hint_used', gameId: 'imlo', itemId: e.itemId, side: e.side, slot: e.slot }];
  }

  return {
    id: 'imlo',
    title: { uzLatn: 'Imlo', uzCyrl: 'Имло' },
    modes: [
      { id: 'oson', name: { uzLatn: 'Oson', uzCyrl: 'Осон' } },
      { id: 'orta', name: { uzLatn: 'Oʻrta', uzCyrl: 'Ўрта' } },
      { id: 'qiyin', name: { uzLatn: 'Qiyin', uzCyrl: 'Қийин' } },
    ],
    levels,
    createRules: (spec, attemptRng) =>
      createImloRules({ pairs: spec.params.pairs, rng: attemptRng }),
    scoring: imloScoring,
    scoringFor: (spec) => scoringFor(spec),
    multipliers: imloMultipliers,
    logEvents,
    difficulty: imloDifficulty,
    chapters: CHAPTERS.map((name) => ({ id: name.toLowerCase(), name, levels: CHAPTER_SIZE })),
    Board,
  };
}

/** Registers Imlo with the shell (once; the pack is loaded by the app). */
export function registerImlo(items: readonly Item[]): ImloDefinition {
  const def = createImloDefinition(items);
  registerGame(def);
  return def;
}
