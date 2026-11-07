/** The games the shell can host. E1 registers Juft; later games add themselves the same way. */
import type { GameEvent } from '../core/session/index.ts';
import type { GameDefinition } from './types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameDefinition = GameDefinition<any, any, any, never>;

export const GAMES: AnyGameDefinition[] = [];

/** Stores a definition type-erased: the shell only needs the contract, not the game's own types. */
export function registerGame<P, S, A, E extends GameEvent = never>(
  def: GameDefinition<P, S, A, E>,
): void {
  if (GAMES.some((g) => g.id === def.id)) throw new Error(`Game "${def.id}" is already registered`);
  GAMES.push(def as unknown as AnyGameDefinition);
}

export function getGame(id: string): AnyGameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
