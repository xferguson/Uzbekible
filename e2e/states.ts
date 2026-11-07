/**
 * Every screen state the app can be driven into, for `npm run shots` (V1) and the layout checks (V2).
 * A new game adds `e2e/states/<id>.ts` (its states, `game: '<id>'`), spreads it in here, and maps each state to its
 * mockup frames in `docs/design/frames.json`. `scripts/shots.test.ts` fails until both are done.
 */
import { juftStates } from './states/juft.ts';
import { shellStates } from './states/shell.ts';
import type { ScreenState } from './shots/types.ts';

export type { Driver, ScreenState } from './shots/types.ts';

export const STATES: readonly ScreenState[] = [...shellStates, ...juftStates];
