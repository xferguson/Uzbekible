import { createMemoryBackend } from '@core/storage';
import { createProgressStore, recordWin } from './progress';

const result = (score: number, stars: 0 | 1 | 2 | 3 = 1, timeMs = 1000) => ({ score, stars, timeMs });

describe('progress', () => {
  it('starts with level 1 unlocked and no bests', () => {
    const store = createProgressStore('juft', { backend: createMemoryBackend() });
    expect(store.get()).toEqual({ unlocked: 1, best: {} });
  });

  it('a win unlocks the next level and reports a new best', () => {
    const store = createProgressStore('juft', { backend: createMemoryBackend() });
    expect(recordWin(store, 1, result(100))).toEqual({ newBest: true });
    expect(store.get().unlocked).toBe(2);
    expect(store.get().best[1]).toEqual(result(100));
  });

  it('best score only increases; stars never drop; unlocked never shrinks', () => {
    const store = createProgressStore('juft', { backend: createMemoryBackend() });
    recordWin(store, 3, result(300, 3));
    expect(recordWin(store, 3, result(200, 1))).toEqual({ newBest: false });
    expect(store.get().best[3]).toEqual(result(300, 3));
    recordWin(store, 1, result(50));
    expect(store.get().unlocked).toBe(4);
    expect(recordWin(store, 3, result(400, 2, 500))).toEqual({ newBest: true });
    expect(store.get().best[3]).toEqual(result(400, 3, 500));
  });

  it('a tied score is not a new best', () => {
    const store = createProgressStore('juft', { backend: createMemoryBackend() });
    recordWin(store, 1, result(100));
    expect(recordWin(store, 1, result(100)).newBest).toBe(false);
  });

  it('keeps games separate', () => {
    const backend = createMemoryBackend();
    recordWin(createProgressStore('a', { backend }), 1, result(10));
    expect(createProgressStore('b', { backend }).get().unlocked).toBe(1);
  });
});
