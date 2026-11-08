import { createMemoryBackend } from '@core/storage';
import {
  createModeStore,
  createProgressStore,
  createRunBestStore,
  recordRun,
  recordWin,
} from './progress';

const result = (score: number, stars: 0 | 1 | 2 | 3 = 1, timeMs = 1000) => ({
  score,
  stars,
  timeMs,
});

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

  it('keeps progress per mode: clearing level 3 in qiyin does not unlock level 4 in oson', () => {
    const backend = createMemoryBackend();
    const qiyin = createProgressStore('imlo', { backend }, 'qiyin');
    const oson = createProgressStore('imlo', { backend }, 'oson');
    recordWin(qiyin, 3, result(100));
    expect(qiyin.get().unlocked).toBe(4);
    expect(oson.get()).toEqual({ unlocked: 1, best: {} });
  });

  it('leaves a no-mode game on its existing storage key', () => {
    const backend = createMemoryBackend();
    recordWin(createProgressStore('juft', { backend }), 2, result(10));
    expect(createProgressStore('juft', { backend }, undefined).get().unlocked).toBe(3);
  });

  it('remembers the chosen mode per game', () => {
    const backend = createMemoryBackend();
    const modes = createModeStore({ backend });
    expect(modes.get()).toEqual({});
    modes.update((m) => ({ ...m, imlo: 'qiyin' }));
    expect(createModeStore({ backend }).get()).toEqual({ imlo: 'qiyin' });
  });
});

describe('run best', () => {
  it('starts at zero and keeps the best score and streak separately', () => {
    const store = createRunBestStore('soxta', { backend: createMemoryBackend() });
    expect(store.get()).toEqual({ score: 0, streak: 0 });
    expect(recordRun(store, { score: 500, streak: 4 })).toEqual({ newBest: true });
    expect(recordRun(store, { score: 300, streak: 9 })).toEqual({ newBest: false });
    expect(store.get()).toEqual({ score: 500, streak: 9 });
  });

  it('a tied score is not a new best', () => {
    const store = createRunBestStore('soxta', { backend: createMemoryBackend() });
    recordRun(store, { score: 500, streak: 4 });
    expect(recordRun(store, { score: 500, streak: 4 }).newBest).toBe(false);
  });

  it('survives a reload from the same storage', () => {
    const backend = createMemoryBackend();
    recordRun(createRunBestStore('soxta', { backend }), { score: 700, streak: 6 });
    expect(createRunBestStore('soxta', { backend }).get()).toEqual({ score: 700, streak: 6 });
  });
});
