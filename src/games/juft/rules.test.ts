import { describe, expect, it } from 'vitest';
import { createRng } from '../../core/random/index.ts';
import { createSession, tallyScoreInput } from '../../core/session/index.ts';
import { createJuftRules, type JuftAction, type JuftEvent, type JuftState } from './rules.ts';
import type { RulesEvent } from '../../core/session/index.ts';

type Ev = RulesEvent<JuftEvent>;

const ids = ['a', 'b', 'c', 'd'];
const rules = createJuftRules({ pairIds: ids, rng: createRng(1) });

function run(actions: JuftAction[]): { state: JuftState; events: Ev[] } {
  let state = rules.init;
  const events: Ev[] = [];
  for (const a of actions) {
    const r = rules.reduce(state, a);
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}
const types = (e: Ev[]): string[] => e.map((x) => x.type);

describe('juft rules', () => {
  it('shuffles each column independently but deterministically', () => {
    const again = createJuftRules({ pairIds: ids, rng: createRng(1) });
    expect(again.init).toEqual(rules.init);
    expect([...rules.init.left].sort()).toEqual(ids);
    expect([...rules.init.right].sort()).toEqual(ids);
    const other = createJuftRules({ pairIds: ids, rng: createRng(2) });
    expect(other.init.left).not.toEqual(rules.init.left);
  });

  it('selects, and tapping the same tile deselects', () => {
    const { state, events } = run([
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'left', tileId: 'a' },
    ]);
    expect(types(events)).toEqual(['selected', 'deselected']);
    expect(state.selected).toBeNull();
  });

  it('moves the selection within a column', () => {
    const { state, events } = run([
      { type: 'select', side: 'right', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'b' },
    ]);
    expect(types(events)).toEqual(['selected', 'deselected', 'selected']);
    expect(state.selected).toEqual({ side: 'right', tileId: 'b' });
  });

  it('matches a cross-column pair in either order and tracks combo', () => {
    const { state, events } = run([
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'b' },
      { type: 'select', side: 'left', tileId: 'b' },
    ]);
    expect(types(events)).toEqual(['selected', 'matched', 'combo', 'selected', 'matched', 'combo']);
    expect(events[4]).toMatchObject({ tileId: 'b', combo: 2 });
    expect(state.matched).toEqual(['a', 'b']);
    expect(state.selected).toBeNull();
  });

  it('mismatch emits lifeLost, clears selection and resets combo', () => {
    const { state, events } = run([
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'a' },
      { type: 'select', side: 'left', tileId: 'b' },
      { type: 'select', side: 'right', tileId: 'c' },
    ]);
    expect(types(events).slice(-3)).toEqual(['mismatched', 'mistake', 'lifeLost']);
    expect(events.at(-3)).toMatchObject({ leftId: 'b', rightId: 'c' });
    expect(state.selected).toBeNull();
    expect(state.combo).toBe(0);
  });

  it('completes when every pair is matched', () => {
    const { events } = run(
      ids.flatMap((id): JuftAction[] => [
        { type: 'select', side: 'left', tileId: id },
        { type: 'select', side: 'right', tileId: id },
      ]),
    );
    expect(types(events).at(-1)).toBe('complete');
    expect(types(events).filter((t) => t === 'complete')).toHaveLength(1);
  });

  it('ignores matched and unknown tiles', () => {
    const { events } = run([
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'a' },
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'zzz' },
      { type: 'hint', tileId: 'a' },
    ]);
    expect(types(events)).toEqual(['selected', 'matched', 'combo']);
  });

  it('hint emits hintShown without touching selection or lives', () => {
    const { state, events } = run([
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'hint', tileId: 'b' },
    ]);
    expect(types(events)).toEqual(['selected', 'hintShown', 'hint']);
    expect(events[1]).toMatchObject({ tileId: 'b' });
    expect(state.selected).toEqual({ side: 'left', tileId: 'a' });
  });

  it('tallies one mismatch, one hint and two matches as score input', () => {
    const { events } = run([
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'b' },
      { type: 'hint', tileId: 'a' },
      { type: 'select', side: 'left', tileId: 'a' },
      { type: 'select', side: 'right', tileId: 'a' },
      { type: 'select', side: 'left', tileId: 'b' },
      { type: 'select', side: 'right', tileId: 'b' },
    ]);
    expect(tallyScoreInput(events)).toEqual({ mistakes: 1, hints: 1, combos: 2 });
  });

  it('three mismatches lose the session (K3 integration)', () => {
    const session = createSession({ rules, lives: 3, countdownMs: 0, clock: { now: () => 0 } });
    session.start();
    for (let i = 0; i < 3; i++) {
      session.dispatch({ type: 'select', side: 'left', tileId: 'a' });
      session.dispatch({ type: 'select', side: 'right', tileId: 'b' });
    }
    expect(session.getState()).toMatchObject({ phase: 'lost', lives: 0 });
  });

  it('clearing the board wins the session', () => {
    const session = createSession({ rules, lives: 3, countdownMs: 0, clock: { now: () => 0 } });
    session.start();
    for (const id of ids) {
      session.dispatch({ type: 'select', side: 'left', tileId: id });
      session.dispatch({ type: 'select', side: 'right', tileId: id });
    }
    expect(session.getState().phase).toBe('won');
  });

  it('rejects empty or duplicate pair ids', () => {
    expect(() => createJuftRules({ pairIds: [], rng: createRng(1) })).toThrow(RangeError);
    expect(() => createJuftRules({ pairIds: ['a', 'a'], rng: createRng(1) })).toThrow(RangeError);
  });
});
