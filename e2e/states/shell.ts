/** Shell screens shared by every game. */
import type { ScreenState } from '../shots/types.ts';

export const shellStates: ScreenState[] = [
  {
    id: 'home',
    game: null,
    title: 'Home: title, tagline and the game picker',
    async reach(d) {
      await d.open();
    },
  },
  {
    id: 'settings',
    game: null,
    title: 'Settings: source languages, Uzbek script, theme, data',
    async reach(d) {
      await d.open();
      await d.tap('Sozlamalar');
    },
  },
];
