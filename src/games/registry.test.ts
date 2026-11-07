import { GAMES, getGame, registerGame } from './registry';
import type { GameDefinition } from './types';

describe('registry', () => {
  it('looks up a registered game by id and rejects duplicates', () => {
    const def = { id: 'registry-test' } as unknown as GameDefinition<unknown, unknown, unknown>;
    registerGame(def);
    expect(getGame('registry-test')).toBe(def);
    expect(GAMES).toContain(def);
    expect(() => registerGame(def)).toThrow(/already registered/i);
  });

  it('returns undefined for an unknown id', () => {
    expect(getGame('nope')).toBeUndefined();
  });
});
