import fc from 'fast-check';
import { describe, it } from 'vitest';
import { createMemoryBackend, createStore } from './index.ts';

const opts = { seed: 20240607, numRuns: 200 };
const isNum = (v: unknown): v is number => typeof v === 'number';

describe('storage properties', () => {
  it('any value valid under vN migrates to a valid vN+1', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e6, max: 1e6 }), (n) => {
        const backend = createMemoryBackend();
        backend.setItem('uzbekible:v1:x', JSON.stringify({ n }));
        const s = createStore(
          'x',
          {
            version: 2,
            default: 0,
            validate: (v): v is number => isNum(v) && Number.isInteger(v),
          },
          { 1: (old) => (old as { n: number }).n },
          { backend },
        );
        return s.get() === n;
      }),
      opts,
    );
  });

  it('set then get round-trips JSON values', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (xs) => {
        const s = createStore(
          'y',
          { version: 1, default: [] as string[], validate: (v): v is string[] => Array.isArray(v) },
          {},
          { backend: createMemoryBackend() },
        );
        s.set(xs);
        return JSON.stringify(s.get()) === JSON.stringify(xs);
      }),
      opts,
    );
  });

  it('arbitrary garbage in storage never throws and yields a valid value', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const backend = createMemoryBackend();
        backend.setItem('uzbekible:v1:z', raw);
        const s = createStore(
          'z',
          { version: 1, default: 0, validate: isNum },
          {},
          { backend, onWarning: () => {} },
        );
        return isNum(s.get());
      }),
      opts,
    );
  });
});
