/** Every game the app ships. Adding a game = one line here; the shell never names a game. */
import type { Item } from '@core/content/index.ts';
import { getGame, GAMES, type AnyGameDefinition } from './registry.ts';
import { registerImlo } from './imlo/definition.ts';
import { registerJuft } from './juft/definition.ts';

const SHIPPED: readonly { id: string; register: (items: readonly Item[]) => unknown }[] = [
  { id: 'juft', register: registerJuft },
  { id: 'imlo', register: registerImlo },
];

/** Registers each shipped game that is not yet registered (safe to call again) and returns them in order. */
export function registerAllGames(items: readonly Item[]): AnyGameDefinition[] {
  for (const g of SHIPPED) if (!getGame(g.id)) g.register(items);
  return [...GAMES];
}
