import { readFileSync } from 'node:fs';
import { loadItems } from '@core/content/index.ts';
import { createRng } from '@core/random/index.ts';
import { createSession } from '@core/session/index.ts';
import { createFakeClock } from '@core/clock/index.ts';
import { levelContext } from '../sim-adapter.ts';
import { createSoxtaDefinition } from './definition.ts';
import { correctSide, type SoxtaEvent } from './rules.ts';

const items = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));
const def = createSoxtaDefinition(items);
const settings = { sourceLangs: ['tr'], script: 'latn' } as const;
const spec = def.levels(levelContext('soxta', 1, settings, []));

describe('Soxta definition', () => {
  it('is an endless game with three lives', () => {
    expect(def.id).toBe('soxta');
    expect(def.endless).toBeDefined();
    expect(def.modes).toBeUndefined();
    expect(spec.lives).toBe(3);
    expect(spec.params.cards.length).toBeGreaterThan(20);
  });

  it('builds the same level for the same context', () => {
    expect(def.levels(levelContext('soxta', 1, settings, [])).seed).toBe(spec.seed);
  });

  it('summarises a run from the final state', () => {
    const clock = createFakeClock(0);
    const session = createSession({
      rules: def.createRules(spec, createRng(5)),
      lives: spec.lives,
      countdownMs: 0,
      clock,
    });
    session.start();
    const right = () =>
      correctSide((session.getState().game as never as { current: never }).current);
    session.dispatch({ type: 'swipe', side: right() });
    session.dispatch({ type: 'swipe', side: right() });
    for (let i = 0; i < 3; i++) {
      const r = right();
      session.dispatch({ type: 'swipe', side: r === 'left' ? 'right' : 'left' });
    }
    const s = session.getState();
    expect(s.phase).toBe('lost');
    const summary = def.endless!.summary(s.game as never);
    expect(summary).toMatchObject({ score: 200, streak: 2, correct: 2, mistakes: 3 });
    // Each missed card is listed once, with the Uzbek word and both meanings.
    expect(summary.missed.length).toBeGreaterThan(0);
    expect(summary.missed.length).toBeLessThanOrEqual(3);
    for (const m of summary.missed) {
      const card = spec.params.cards.find((c) => c.id === m.id)!;
      expect(m).toMatchObject({
        uz: card.uz.uz,
        uzMeaning: card.clues.uz,
        source: { lang: 'tr', text: card.other.text },
      });
      expect(m.sourceMeaning).toBe(card.clues.other);
    }
  });

  it('drops a missed id it does not know, and has a ready-card intro', () => {
    const s = { score: 0, bestStreak: 0, correct: 0, mistakes: 1, missed: ['nope'] };
    expect(def.endless!.summary(s as never).missed).toEqual([]);
    expect(def.endless!.intro.kicker).toMatch(/False friends/);
  });

  describe('logEvents', () => {
    const card = spec.params.cards[0]!;
    const log = (e: SoxtaEvent) => def.logEvents!(spec, e, 700);
    const base = { itemId: card.id };

    it('logs a correct swipe with the word the player picked', () => {
      expect(
        log({ type: 'swipeCorrect', ...base, side: 'left', clue: 'uz', points: 100, streak: 1 }),
      ).toEqual([
        {
          type: 'swipe_correct',
          gameId: 'soxta',
          itemId: card.id,
          sourceLang: 'tr',
          side: 'uz',
          rtMs: 700,
        },
      ]);
      expect(
        log({
          type: 'swipeCorrect',
          ...base,
          side: 'left',
          clue: 'other',
          points: 100,
          streak: 1,
        })[0],
      ).toMatchObject({
        side: 'source',
      });
    });

    it('logs a wrong swipe with the word picked, and a timeout without one', () => {
      expect(
        log({
          type: 'swipeWrong',
          ...base,
          side: 'left',
          clue: 'uz',
          reveal: { picked: 'other', gloss: 'x' },
        }),
      ).toEqual([
        {
          type: 'swipe_wrong',
          gameId: 'soxta',
          itemId: card.id,
          sourceLang: 'tr',
          side: 'source',
          rtMs: 700,
        },
      ]);
      expect(log({ type: 'timeout', ...base, clue: 'uz' })).toEqual([
        { type: 'swipe_timeout', gameId: 'soxta', itemId: card.id, sourceLang: 'tr', rtMs: 700 },
      ]);
    });

    it('ignores other events and unknown items', () => {
      expect(def.logEvents!(spec, { type: 'combo' }, 1)).toEqual([]);
      expect(log({ type: 'timeout', itemId: 'nope', clue: 'uz' })).toEqual([]);
    });
  });
});
