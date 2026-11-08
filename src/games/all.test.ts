import { readFileSync } from 'node:fs';
import { loadItems } from '@core/content/index.ts';
import { registerAllGames } from './all.ts';

const items = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));

describe('registerAllGames', () => {
  it('registers Juft then Imlo, and is safe to call again', () => {
    expect(registerAllGames(items).map((g) => g.id)).toEqual(['juft', 'imlo']);
    expect(registerAllGames(items).map((g) => g.id)).toEqual(['juft', 'imlo']);
  });
});
