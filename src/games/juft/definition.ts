/**
 * The Juft `GameDefinition`: wires the level generator, rules, scoring, difficulty and board into the shared
 * shell contract. Content is injected so the definition can be built once the item pack has loaded.
 */
import type { Item } from '@core/content/index.ts';
import type { LogEventInput } from '@core/learning-log/index.ts';
import type { GameEvent } from '@core/session/index.ts';
import { registerGame } from '../registry.ts';
import type { GameDefinition, GameSettings, LevelSpec } from '../types.ts';
import { Board } from './Board.tsx';
import { CHAPTER_SIZE, juftDifficulty } from './difficulty.config.ts';
import { createJuftLevels, type JuftParams } from './levels.ts';
import { createJuftRules, type JuftAction, type JuftEvent, type JuftState } from './rules.ts';
import { CYRILLIC_MULTIPLIER, juftScoring, scoringFor } from './scoring.config.ts';

/** The eight buildings of the level map, in order (docs/games/01-juft.md). */
const CHAPTERS = [
  'Gumbaz',
  'Minora',
  'Ayvon',
  'Darvoza',
  'Madrasa',
  'Maqbara',
  'Masjid',
  'Registon',
];

export type JuftDefinition = GameDefinition<JuftParams, JuftState, JuftAction, JuftEvent>;

export function createJuftDefinition(items: readonly Item[]): JuftDefinition {
  const levels = createJuftLevels(items);

  function logEvents(spec: LevelSpec<JuftParams>, event: GameEvent, rtMs: number): LogEventInput[] {
    const pair = (id: string) => spec.params.pairs.find((p) => p.id === id);
    const e = event as JuftEvent;
    if (e.type === 'matched') {
      const p = pair(e.tileId);
      if (!p) return [];
      return [
        {
          type: 'match_correct',
          gameId: 'juft',
          itemId: p.id,
          sourceLang: p.source.lang,
          relation: p.source.relation,
          rtMs,
        },
      ];
    }
    if (e.type === 'mismatched') {
      const p = pair(e.leftId);
      if (!p) return [];
      return [
        {
          type: 'match_wrong',
          gameId: 'juft',
          leftItemId: e.leftId,
          rightItemId: e.rightId,
          sourceLang: p.source.lang,
          relation: p.source.relation,
          rtMs,
        },
      ];
    }
    if (e.type === 'hintShown') return [{ type: 'hint_used', gameId: 'juft', itemId: e.tileId }];
    return [];
  }

  return {
    id: 'juft',
    title: { uzLatn: 'Juft', uzCyrl: 'Жуфт' },
    levels,
    createRules: (spec, attemptRng) =>
      createJuftRules({ pairIds: spec.params.pairs.map((p) => p.id), rng: attemptRng }),
    scoring: juftScoring,
    scoringFor: (spec) => scoringFor(spec.level, spec.params.pairs.length),
    multipliers: (settings: GameSettings) =>
      settings.script === 'cyrl' ? [CYRILLIC_MULTIPLIER] : [],
    logEvents,
    difficulty: juftDifficulty,
    chapters: CHAPTERS.map((name) => ({ id: name.toLowerCase(), name, levels: CHAPTER_SIZE })),
    Board,
  };
}

/** Registers Juft with the shell (once; the pack is loaded by the app). */
export function registerJuft(items: readonly Item[]): JuftDefinition {
  const def = createJuftDefinition(items);
  registerGame(def);
  return def;
}
