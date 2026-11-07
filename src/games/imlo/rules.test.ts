import { describe, expect, it } from 'vitest';
import { createRng } from '@core/random/index.ts';
import type { ImloPair } from './levels.ts';
import { createImloRules, type ImloAction, type ImloState } from './rules.ts';

const pair = (itemId: string, src: string[], uz: string[], extra: string[] = []): ImloPair => ({
  itemId,
  clue: itemId,
  source: { lang: 'tr', text: src.join(''), letters: src },
  uz: { text: uz.join(''), letters: uz },
  bank: [
    ...src.map((letter, i) => ({ id: `s${i}`, letter, origin: 'source' as const })),
    ...uz.map((letter, i) => ({ id: `u${i}`, letter, origin: 'uz' as const })),
    ...extra.map((letter, i) => ({ id: `d${i}`, letter, origin: 'distractor' as const })),
  ],
});

const isim = pair('name', [...'isim'], [...'ism']);
const kitap = pair('book', [...'kitap'], [...'kitob']);

const make = (pairs = [isim, kitap]) => {
  const rules = createImloRules({ pairs, rng: createRng(1) });
  let state: ImloState = rules.init;
  const events: string[] = [];
  const all: unknown[] = [];
  const act = (a: ImloAction) => {
    const r = rules.reduce(state, a);
    state = r.state;
    for (const e of r.events) {
      events.push(e.type);
      all.push(e);
    }
    return r;
  };
  /** Tile id in the bank of the current pair with this letter, not yet placed. */
  const free = (letter: string) => {
    const p = pairs[state.pair]!;
    const used = new Set([...state.slots.source, ...state.slots.uz]);
    return p.bank.find((t) => t.letter === letter && !used.has(t.id))!.id;
  };
  const spell = (letters: readonly string[]) => {
    for (const l of letters) act({ type: 'place', tileId: free(l) });
  };
  return {
    act,
    spell,
    free,
    events,
    all,
    get state() {
      return state;
    },
  };
};

describe('imlo rules', () => {
  it('spelling isim then ism checks correct and moves to pair 2', () => {
    const g = make();
    expect(g.state.active).toBe('source');
    g.spell([...'isim']);
    expect(g.state.active).toBe('uz');
    g.spell([...'ism']);
    g.act({ type: 'check' });
    expect(g.events).toContain('spellCorrect');
    expect(g.state.pair).toBe(1);
    expect(g.state.active).toBe('source');
    expect(g.state.slots.source).toEqual([null, null, null, null, null]);
  });

  it('place fills the first empty slot and switches side only when the active side fills', () => {
    const g = make();
    g.act({ type: 'place', tileId: 's0' });
    g.act({ type: 'place', tileId: 's1' });
    expect(g.state.slots.source.slice(0, 2)).toEqual(['s0', 's1']);
    g.act({ type: 'remove', side: 'source', slot: 0 });
    g.act({ type: 'place', tileId: 's3' });
    expect(g.state.slots.source).toEqual(['s3', 's1', null, null]);
  });

  it('ignores placing a placed tile, an unknown tile, or onto a full active side', () => {
    const g = make();
    g.act({ type: 'place', tileId: 's0' });
    const before = g.state;
    g.act({ type: 'place', tileId: 's0' });
    g.act({ type: 'place', tileId: 'nope' });
    expect(g.state).toBe(before);
    g.spell([...'sim']);
    g.spell([...'ism']);
    const full = g.state;
    g.act({ type: 'selectSide', side: 'source' });
    g.act({ type: 'place', tileId: 'u0' });
    expect(g.state.slots).toEqual(full.slots);
  });

  it('selectSide switches the active side', () => {
    const g = make();
    g.act({ type: 'selectSide', side: 'uz' });
    expect(g.state.active).toBe('uz');
    g.act({ type: 'place', tileId: 'u0' });
    expect(g.state.slots.uz[0]).toBe('u0');
  });

  it('remove returns the tile and leaves the slot empty; empty slots are a no-op', () => {
    const g = make();
    g.act({ type: 'place', tileId: 's0' });
    g.act({ type: 'remove', side: 'source', slot: 0 });
    expect(g.state.slots.source[0]).toBeNull();
    const before = g.state;
    g.act({ type: 'remove', side: 'source', slot: 0 });
    g.act({ type: 'remove', side: 'source', slot: 99 });
    expect(g.state).toBe(before);
  });

  it('check is a no-op until both sides are full', () => {
    const g = make();
    g.spell([...'isim']);
    const before = g.state;
    expect(g.act({ type: 'check' }).events).toEqual([]);
    expect(g.state).toBe(before);
  });

  it('compares letter values, not tile ids (any i fills any i)', () => {
    const g = make();
    g.act({ type: 'place', tileId: 'u0' }); // an Uzbek-origin i in the source row
    g.act({ type: 'place', tileId: 's1' });
    g.act({ type: 'place', tileId: 's2' });
    g.act({ type: 'place', tileId: 's3' });
    g.act({ type: 'selectSide', side: 'uz' });
    g.act({ type: 'place', tileId: 's0' });
    g.act({ type: 'place', tileId: 'u1' });
    g.act({ type: 'place', tileId: 'u2' });
    g.act({ type: 'check' });
    expect(g.events).toContain('spellCorrect');
  });

  it('wrong on both sides reports each side and costs one life in total', () => {
    const h = make();
    h.spell([...'isim'].reverse());
    h.spell([...'ism'].reverse());
    h.act({ type: 'check' });
    const wrong = h.all.filter((e) => (e as { type: string }).type === 'spellWrong');
    expect(wrong).toEqual([
      expect.objectContaining({ side: 'source', given: 'misi', expected: 'isim' }),
      expect.objectContaining({ side: 'uz', given: 'msi', expected: 'ism' }),
    ]);
    expect(h.events.filter((e) => e === 'lifeLost')).toHaveLength(1);
    expect(h.events.filter((e) => e === 'mistake')).toHaveLength(1);
    expect(h.state.pair).toBe(0);
    expect(h.state.slots.source.every((s) => s !== null)).toBe(true);
  });

  it('wrong on one side reports only that side', () => {
    const g = make();
    g.spell([...'isim']);
    g.spell([...'smi']);
    g.act({ type: 'check' });
    const wrong = g.all.filter((e) => (e as { type: string }).type === 'spellWrong');
    expect(wrong).toEqual([expect.objectContaining({ side: 'uz', given: 'smi' })]);
  });

  it('hint takes a bank tile into the slot and locks it; locked slots cannot be removed', () => {
    const g = make();
    g.act({ type: 'hint', side: 'uz', slot: 1 });
    expect(g.events).toEqual(expect.arrayContaining(['hint', 'hintUsed']));
    const id = g.state.slots.uz[1]!;
    expect(isim.bank.find((t) => t.id === id)!.letter).toBe('s');
    expect(g.state.locked.uz[1]).toBe(true);
    const before = g.state;
    g.act({ type: 'remove', side: 'uz', slot: 1 });
    expect(g.state).toBe(before);
    g.act({ type: 'hint', side: 'uz', slot: 1 });
    expect(g.state).toBe(before);
  });

  it('hint replaces a wrong tile in the slot and fetches a misplaced tile when the bank has none', () => {
    const g = make([pair('x', [...'ab'], [...'ba'])]);
    // Fill source with the two b's/a's wrongly: source needs a,b ; put b then a.
    g.act({ type: 'place', tileId: 's1' }); // b
    g.act({ type: 'place', tileId: 's0' }); // a  -> "ba" wrong
    g.act({ type: 'selectSide', side: 'uz' });
    g.act({ type: 'place', tileId: 'u0' }); // b -> uz "b" correct
    g.act({ type: 'place', tileId: 'u1' }); // a -> uz "ba" correct
    // Source slot 0 should be a. Bank is empty; the 'a' sits in source slot 1 (misplaced).
    g.act({ type: 'hint', side: 'source', slot: 0 });
    const p = g.state;
    const letter = (id: string | null) =>
      ['a', 'b'].find((l) => l === (id === 's0' || id === 'u1' ? 'a' : 'b'));
    expect(letter(p.slots.source[0]!)).toBe('a');
    expect(p.locked.source[0]).toBe(true);
    expect(p.slots.source[1]).toBeNull();
  });

  it('hint on a slot that already holds the right letter just locks it', () => {
    const g = make();
    g.act({ type: 'place', tileId: 's0' });
    const placed = g.state.slots.source[0];
    g.act({ type: 'hint', side: 'source', slot: 0 });
    expect(g.state.slots.source[0]).toBe(placed);
    expect(g.state.locked.source[0]).toBe(true);
  });

  it('hint events carry side and slot; an out-of-range slot is ignored', () => {
    const g = make();
    g.act({ type: 'hint', side: 'source', slot: 99 });
    expect(g.events).toEqual([]);
    g.act({ type: 'hint', side: 'source', slot: 2 });
    expect(g.all).toContainEqual(
      expect.objectContaining({ type: 'hintUsed', side: 'source', slot: 2 }),
    );
  });

  it('emits combo only for first-try pairs and completes after the last pair', () => {
    const g = make();
    g.spell([...'isim']);
    g.spell([...'ism']);
    g.act({ type: 'check' });
    expect(g.events.filter((e) => e === 'combo')).toHaveLength(1);
    g.spell([...'kitap']);
    g.spell([...'kitob'].reverse());
    g.act({ type: 'check' }); // wrong
    expect(g.state.pair).toBe(1);
    for (const side of ['uz'] as const)
      for (let i = 4; i >= 0; i--) g.act({ type: 'remove', side, slot: i });
    g.act({ type: 'selectSide', side: 'uz' });
    g.spell([...'kitob']);
    g.act({ type: 'check' });
    expect(g.events.filter((e) => e === 'combo')).toHaveLength(1);
    expect(g.events.filter((e) => e === 'complete')).toHaveLength(1);
    expect(g.state.pair).toBe(2);
    expect(g.all).toContainEqual(expect.objectContaining({ type: 'spellCorrect', checks: 2 }));
  });

  it('does nothing after the level is complete', () => {
    const g = make([pair('x', ['a'], ['b'])]);
    g.spell(['a']);
    g.spell(['b']);
    g.act({ type: 'check' });
    const done = g.state;
    expect(g.act({ type: 'check' }).events).toEqual([]);
    expect(g.act({ type: 'hint', side: 'uz', slot: 0 }).events).toEqual([]);
    expect(g.act({ type: 'selectSide', side: 'uz' }).state).toBe(done);
  });

  it('bank order is a per-pair shuffle, different seeds differ, same seed repeats', () => {
    const a = createImloRules({ pairs: [isim], rng: createRng(1) }).init.banks[0];
    const b = createImloRules({ pairs: [isim], rng: createRng(1) }).init.banks[0];
    expect(a).toEqual(b);
    expect([...a!].sort()).toEqual(isim.bank.map((t) => t.id).sort());
    const orders = new Set(
      [1, 2, 3, 4, 5].map((s) =>
        createImloRules({ pairs: [isim], rng: createRng(s) }).init.banks[0]!.join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('rejects an empty level', () => {
    expect(() => createImloRules({ pairs: [], rng: createRng(1) })).toThrow(RangeError);
  });
});
