import { describe, expect, it, vi } from 'vitest';
import {
  createMemoryBackend,
  createStore,
  storageKey,
  type StorageBackend,
  type StoreWarning,
} from './index';

interface V2 {
  coins: number;
  name: string;
}
const isV2 = (v: unknown): v is V2 =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as V2).coins === 'number' &&
  typeof (v as V2).name === 'string';
const schema = { version: 2, default: { coins: 0, name: '' } as V2, validate: isV2 };
const migrations = { 1: (old: unknown) => ({ coins: Number(old), name: '' }) };

const throwing: StorageBackend = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
  removeItem: () => {
    throw new Error('denied');
  },
};

describe('createStore', () => {
  it('builds keys as uzbekible:v<n>:<namespace>', () => {
    expect(storageKey('settings', 3)).toBe('uzbekible:v3:settings');
  });

  it('returns the default when nothing is stored', () => {
    const s = createStore('p', schema, migrations, { backend: createMemoryBackend() });
    expect(s.get()).toEqual({ coins: 0, name: '' });
  });

  it('persists set and update under the versioned key', () => {
    const backend = createMemoryBackend();
    const s = createStore('p', schema, migrations, { backend });
    s.set({ coins: 1, name: 'a' });
    s.update((v) => ({ ...v, coins: v.coins + 4 }));
    expect(JSON.parse(backend.getItem('uzbekible:v2:p')!)).toEqual({ coins: 5, name: 'a' });
    const again = createStore('p', schema, migrations, { backend });
    expect(again.get().coins).toBe(5);
  });

  it('notifies subscribers until unsubscribed', () => {
    const s = createStore('p', schema, migrations, { backend: createMemoryBackend() });
    const seen: number[] = [];
    const off = s.subscribe((v) => seen.push(v.coins));
    s.set({ coins: 1, name: '' });
    off();
    s.set({ coins: 2, name: '' });
    expect(seen).toEqual([1]);
  });

  it('runs the migration chain on read from an older version', () => {
    const backend = createMemoryBackend();
    backend.setItem('uzbekible:v1:p', '7');
    const s = createStore('p', schema, migrations, { backend });
    expect(s.get()).toEqual({ coins: 7, name: '' });
    expect(backend.getItem('uzbekible:v2:p')).not.toBeNull();
  });

  it('chains several migrations', () => {
    const backend = createMemoryBackend();
    backend.setItem('uzbekible:v1:p', '2');
    const s = createStore(
      'p',
      { version: 3, default: 0, validate: (v): v is number => typeof v === 'number' },
      { 1: (o) => Number(o) * 10, 2: (o) => (o as number) + 1 },
      { backend },
    );
    expect(s.get()).toBe(21);
  });

  it('resets corrupt JSON to default with a warning, never throwing', () => {
    const backend = createMemoryBackend();
    backend.setItem('uzbekible:v2:p', '{not json');
    const warnings: StoreWarning[] = [];
    const s = createStore('p', schema, migrations, {
      backend,
      onWarning: (w) => warnings.push(w),
    });
    expect(s.get()).toEqual(schema.default);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ namespace: 'p', reason: 'corrupt' });
  });

  it('resets schema-invalid data with a warning', () => {
    const backend = createMemoryBackend();
    backend.setItem('uzbekible:v2:p', JSON.stringify({ coins: 'x' }));
    const onWarning = vi.fn();
    const s = createStore('p', schema, migrations, { backend, onWarning });
    expect(s.get()).toEqual(schema.default);
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ reason: 'invalid' }));
  });

  it('resets when a migration throws', () => {
    const backend = createMemoryBackend();
    backend.setItem('uzbekible:v1:p', '1');
    const onWarning = vi.fn();
    const s = createStore(
      'p',
      schema,
      {
        1: () => {
          throw new Error('boom');
        },
      },
      { backend, onWarning },
    );
    expect(s.get()).toEqual(schema.default);
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ reason: 'migration' }));
  });

  it('falls back to memory when the backend throws', () => {
    const onWarning = vi.fn();
    const s = createStore('p', schema, migrations, { backend: throwing, onWarning });
    expect(s.get()).toEqual(schema.default);
    s.set({ coins: 9, name: 'z' });
    expect(s.get().coins).toBe(9);
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ reason: 'unavailable' }));
  });

  it('keeps namespaces separate', () => {
    const backend = createMemoryBackend();
    const a = createStore('a', schema, migrations, { backend });
    const b = createStore('b', schema, migrations, { backend });
    a.set({ coins: 1, name: '' });
    expect(b.get().coins).toBe(0);
  });

  it('defaults to localStorage, tolerating its absence', () => {
    const s = createStore('p', schema, migrations);
    s.set({ coins: 3, name: '' });
    expect(s.get().coins).toBe(3);
  });
});
