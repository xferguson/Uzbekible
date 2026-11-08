import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeItem } from '@core/content/fixtures.ts';
import { createRng } from '@core/random/index.ts';
import { createSession } from '@core/session/index.ts';
import { createFakeClock } from '@core/clock/index.ts';
import type { Card, CardTier } from './cards.ts';
import { LIVES, streakMultiplier } from './config.ts';
import {
  cardMsFor,
  correctSide,
  createSoxtaRules,
  type Side,
  type SoxtaAction,
  type SoxtaState,
} from './rules.ts';

const card = (id: string, tier: CardTier = 1, other?: string): Card => ({
  id,
  uz: makeItem({ id, glossEn: `uz-${id}` }),
  other: { lang: 'tr', text: `tr-${id}` },
  clues: other ? { uz: `uz-${id}`, other } : { uz: `uz-${id}` },
  tier,
});
const pool = (n = 8) => Array.from({ length: n }, (_, i) => card(`c${i}`));
const opp = (s: Side): Side => (s === 'left' ? 'right' : 'left');

const make = (cards = pool(), seed = 1) => {
  const rules = createSoxtaRules({ cards, rng: createRng(seed) });
  let state: SoxtaState = rules.init;
  const events: { type: string }[] = [];
  const act = (a: SoxtaAction) => {
    const r = rules.reduce(state, a);
    state = r.state;
    events.push(...r.events);
    return r;
  };
  const right = () => act({ type: 'swipe', side: correctSide(state.current) });
  const wrong = () => act({ type: 'swipe', side: opp(correctSide(state.current)) });
  return {
    act,
    right,
    wrong,
    events,
    get state() {
      return state;
    },
  };
};

describe('soxta rules', () => {
  it('a swipe toward the clued word scores and advances', () => {
    const g = make();
    const before = g.state.current.card.id;
    const r = g.right();
    expect(r.events.map((e) => e.type)).toEqual(['swipeCorrect']);
    expect(g.state).toMatchObject({ streak: 1, score: 100, correct: 1, mistakes: 0 });
    expect(g.state.current.card.id).not.toBe(before);
  });

  it('the other side loses a life and reveals the picked word', () => {
    const g = make();
    const id = g.state.current.card.id;
    const r = g.wrong();
    expect(r.events.map((e) => e.type)).toEqual(['swipeWrong', 'mistake', 'lifeLost']);
    expect(r.events[0]).toMatchObject({
      type: 'swipeWrong',
      itemId: id,
      reveal: { picked: 'other' },
    });
    expect(g.state).toMatchObject({ streak: 0, mistakes: 1, missed: [id] });
  });

  it('an other-word clue is answered on the Turkish side', () => {
    const rules = createSoxtaRules({ cards: [card('a', 1, 'tr meaning')], rng: createRng(3) });
    let s = rules.init;
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      seen.add(s.current.clue.kind);
      const side = s.current.clue.kind === 'other' ? opp(s.current.uzSide) : s.current.uzSide;
      expect(correctSide(s.current)).toBe(side);
      s = rules.reduce(s, { type: 'swipe', side }).state;
    }
    expect(seen).toEqual(new Set(['uz', 'other']));
  });

  it('cards without a Turkish gloss only get Uzbek-meaning clues', () => {
    const g = make();
    for (let i = 0; i < 20; i++) {
      expect(g.state.current.clue.kind).toBe('uz');
      g.right();
    }
  });

  it('is deterministic: same seed, same run', () => {
    const run = (seed: number) => {
      const g = make(pool(), seed);
      const out: string[] = [];
      for (let i = 0; i < 12; i++) {
        out.push(`${g.state.current.card.id}${g.state.current.uzSide}`);
        g.right();
      }
      return out;
    };
    expect(run(5)).toEqual(run(5));
    expect(run(5)).not.toEqual(run(6));
  });

  it('the Uzbek word lands on both sides across a run', () => {
    const g = make(pool(20));
    const sides = new Set<Side>();
    for (let i = 0; i < 20; i++) {
      sides.add(g.state.current.uzSide);
      g.right();
    }
    expect(sides.size).toBe(2);
  });

  it('the card timer tightens with the streak and never below the floor', () => {
    expect(cardMsFor(0)).toBe(6000);
    expect(cardMsFor(15)).toBeLessThan(cardMsFor(5));
    expect(cardMsFor(500)).toBe(2500);
    const g = make();
    expect(g.state.current.remainingMs).toBe(6000);
    for (let i = 0; i < 10; i++) g.right();
    expect(g.state.current.remainingMs).toBe(cardMsFor(10));
  });

  it('ticks count the card down; running out is a mistake', () => {
    const g = make();
    const id = g.state.current.card.id;
    g.act({ type: 'tick', ms: 1000 });
    expect(g.state.current.remainingMs).toBe(5000);
    expect(g.events).toEqual([]);
    const r = g.act({ type: 'tick', ms: 5000 });
    expect(r.events.map((e) => e.type)).toEqual(['timeout', 'mistake', 'lifeLost']);
    expect(g.state).toMatchObject({ streak: 0, mistakes: 1, missed: [id] });
    expect(g.state.current.remainingMs).toBe(6000);
  });

  it('ignores non-positive ticks', () => {
    const g = make();
    g.act({ type: 'tick', ms: 0 });
    g.act({ type: 'tick', ms: -5 });
    expect(g.state.current.remainingMs).toBe(6000);
  });

  it('streak multiplier steps up and is capped', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(4)).toBe(1);
    expect(streakMultiplier(5)).toBe(1.5);
    expect(streakMultiplier(1000)).toBe(3);
    const g = make();
    for (let i = 0; i < 6; i++) g.right();
    // 5 cards at x1 = 500, the 6th at x1.5 = 150
    expect(g.state.score).toBe(650);
    expect(g.events.filter((e) => e.type === 'combo')).toHaveLength(5);
  });

  it('the run is over at 3 mistakes and then ignores input', () => {
    const g = make();
    g.wrong();
    g.wrong();
    expect(g.state.over).toBe(false);
    g.wrong();
    expect(g.state.over).toBe(true);
    const n = g.events.length;
    g.right();
    g.act({ type: 'tick', ms: 99999 });
    expect(g.events).toHaveLength(n);
    expect(g.state.mistakes).toBe(LIVES);
  });

  it('missed cards come back later and clear when answered', () => {
    const g = make(pool(12), 7);
    const id = g.state.current.card.id;
    g.wrong();
    const shown: string[] = [];
    for (let i = 0; i < 6; i++) {
      shown.push(g.state.current.card.id);
      g.right();
    }
    expect(shown).toContain(id);
    expect(g.state.missed).not.toContain(id);
  });

  it('a card is not repeated back to back when others exist', () => {
    const g = make(pool(3), 2);
    let prev = g.state.current.card.id;
    for (let i = 0; i < 30; i++) {
      if (i % 3 === 0) g.wrong();
      else g.right();
      if (g.state.over) break;
      expect(g.state.current.card.id).not.toBe(prev);
      prev = g.state.current.card.id;
    }
  });

  it('shows easier tiers first and cycles when the pool runs dry', () => {
    const cards = [card('hard', 3), card('mid', 2), card('easy', 1)];
    const g = make(cards, 4);
    const order: string[] = [];
    for (let i = 0; i < 6; i++) {
      order.push(g.state.current.card.id);
      g.right();
    }
    expect(order.slice(0, 3)).toEqual(['easy', 'mid', 'hard']);
    expect(order.slice(3)).toHaveLength(3);
  });

  it('rejects an empty pool', () => {
    expect(() => createSoxtaRules({ cards: [], rng: createRng(1) })).toThrow(RangeError);
  });

  it('plays inside a session: three lives lost ends the run', () => {
    const clock = createFakeClock();
    const rules = createSoxtaRules({ cards: pool(), rng: createRng(1) });
    const session = createSession({ rules, lives: LIVES, countdownMs: 0, clock });
    session.start();
    session.tick();
    for (let i = 0; i < 3; i++)
      session.dispatch({
        type: 'swipe',
        side: opp(correctSide(session.getState().game.current)),
      });
    expect(session.getState().phase).toBe('lost');
    expect(session.getState().lives).toBe(0);
  });
});

describe('soxta rules (properties)', () => {
  const actions = fc.array(
    fc.oneof(
      fc.constantFrom<'right' | 'wrong'>('right', 'wrong'),
      fc.integer({ min: 1, max: 8000 }),
    ),
    { maxLength: 60 },
  );

  it('lives never go below 0; over iff lives = 0; the clue side is the clued word’s side', () => {
    fc.assert(
      fc.property(fc.integer(), actions, (seed, steps) => {
        const cards = [card('a', 1, 'x'), card('b', 2), card('c', 3, 'y'), card('d', 1)];
        const rules = createSoxtaRules({ cards, rng: createRng(seed) });
        let s = rules.init;
        let lost = 0;
        for (const step of steps) {
          const action: SoxtaAction =
            typeof step === 'number'
              ? { type: 'tick', ms: step }
              : {
                  type: 'swipe',
                  side: step === 'right' ? correctSide(s.current) : opp(correctSide(s.current)),
                };
          const was = s.over;
          const r = rules.reduce(s, action);
          s = r.state;
          lost += r.events.filter((e) => e.type === 'lifeLost').length;
          if (was) expect(r.events).toEqual([]);
          const owner = s.current.clue.kind === 'uz' ? s.current.uzSide : opp(s.current.uzSide);
          expect(correctSide(s.current)).toBe(owner);
          expect(LIVES - lost).toBeGreaterThanOrEqual(0);
          expect(s.over).toBe(LIVES - lost === 0);
        }
      }),
    );
  });
});
