/** Namespaced, versioned localStorage with migrations and an in-memory fallback. Never throws. */

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoreWarning {
  namespace: string;
  reason: 'corrupt' | 'invalid' | 'migration' | 'unavailable';
  detail?: string;
}

export interface Schema<T> {
  /** Current schema version (>= 1). */
  version: number;
  default: T;
  validate(value: unknown): value is T;
}

/** `migrations[n]` turns a version-n value into a version-(n+1) value. */
export type Migrations = Record<number, (old: unknown) => unknown>;

export interface StoreOptions {
  backend?: StorageBackend;
  onWarning?: (warning: StoreWarning) => void;
}

export interface Store<T> {
  get(): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  subscribe(listener: (value: T) => void): () => void;
}

export const storageKey = (namespace: string, version: number): string =>
  `uzbekible:v${version}:${namespace}`;

export function createMemoryBackend(): StorageBackend {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function defaultBackend(): StorageBackend {
  try {
    return globalThis.localStorage ?? createMemoryBackend();
  } catch {
    return createMemoryBackend();
  }
}

export function createStore<T>(
  namespace: string,
  schema: Schema<T>,
  migrations: Migrations,
  options: StoreOptions = {},
): Store<T> {
  const backend = options.backend ?? defaultBackend();
  const memory = createMemoryBackend();
  const listeners = new Set<(value: T) => void>();
  let useMemory = false;
  let cache: { value: T } | undefined;

  const warn = (reason: StoreWarning['reason'], detail?: string): void => {
    try {
      options.onWarning?.({ namespace, reason, detail });
    } catch {
      /* a warning listener must never break storage */
    }
  };
  const fail = (err: unknown): void => {
    // Only the real backend can throw: once we are on memory, `fail` is never reached again.
    useMemory = true;
    warn('unavailable', String(err));
  };
  const active = (): StorageBackend => (useMemory ? memory : backend);

  const read = (key: string): string | null => {
    try {
      return active().getItem(key);
    } catch (err) {
      fail(err);
      return memory.getItem(key);
    }
  };
  const write = (key: string, value: string): void => {
    try {
      active().setItem(key, value);
    } catch (err) {
      fail(err);
      memory.setItem(key, value);
    }
  };

  const persist = (value: T): void =>
    write(storageKey(namespace, schema.version), JSON.stringify(value));

  const load = (): T => {
    for (let v = schema.version; v >= 1; v--) {
      const raw = read(storageKey(namespace, v));
      if (raw === null) continue;
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch (err) {
        warn('corrupt', String(err));
        return schema.default;
      }
      try {
        for (let from = v; from < schema.version; from++) {
          const step = migrations[from];
          if (!step) throw new Error(`no migration from v${from}`);
          value = step(value);
        }
      } catch (err) {
        warn('migration', String(err));
        return schema.default;
      }
      if (!schema.validate(value)) {
        warn('invalid');
        return schema.default;
      }
      if (v !== schema.version) persist(value);
      return value;
    }
    return schema.default;
  };

  const get = (): T => (cache ??= { value: load() }).value;
  const set = (value: T): void => {
    cache = { value };
    persist(value);
    for (const l of [...listeners]) l(value);
  };

  return {
    get,
    set,
    update: (fn) => set(fn(get())),
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
