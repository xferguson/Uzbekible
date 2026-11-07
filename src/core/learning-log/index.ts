/** The research instrument: every attempt logged locally, capped, aggregated and exportable. */
import type { Clock } from '../clock/index.ts';
import type { Lang, Relation } from '../content/schema.ts';
import { createStore, type Store, type StoreOptions } from '../storage/index.ts';

interface Base {
  gameId: string;
  ts: number;
  sessionId: string;
}

export type LogEvent = Base &
  (
    | { type: 'level_start'; level?: number }
    | { type: 'match_correct'; itemId: string; sourceLang: Lang; relation: Relation; rtMs: number }
    | {
        type: 'match_wrong';
        leftItemId: string;
        rightItemId: string;
        sourceLang: Lang;
        relation: Relation;
        rtMs: number;
      }
    | { type: 'hint_used'; itemId: string }
    | { type: 'level_complete'; score: number; timeMs: number; mistakes: number; hints: number }
    | { type: 'level_failed'; level?: number }
  );

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** What a game passes to `log`: `ts` and `sessionId` are filled in by the log. */
export type LogEventInput = DistributiveOmit<LogEvent, 'ts' | 'sessionId'>;

export interface Aggregate {
  itemId: string;
  sourceLang: Lang;
  relation: Relation;
  attempts: number;
  correct: number;
  meanRtMs: number;
}

/** Internal running totals; sums (not means) so rollover is exact. */
interface Totals {
  itemId: string;
  sourceLang: Lang;
  relation: Relation;
  attempts: number;
  correct: number;
  rtSumMs: number;
}

interface LogState {
  events: LogEvent[];
  rolled: Totals[];
}

export const DEFAULT_CAP = 5000;
const NAMESPACE = 'learning-log';

const isState = (v: unknown): v is LogState =>
  typeof v === 'object' &&
  v !== null &&
  Array.isArray((v as LogState).events) &&
  Array.isArray((v as LogState).rolled);

const keyOf = (t: Pick<Totals, 'itemId' | 'sourceLang' | 'relation'>): string =>
  JSON.stringify([t.itemId, t.sourceLang, t.relation]);

/** Folds an event into totals; events that are not item attempts are ignored. */
function fold(into: Map<string, Totals>, e: LogEvent): void {
  let itemId: string;
  let correct: number;
  if (e.type === 'match_correct') {
    itemId = e.itemId;
    correct = 1;
  } else if (e.type === 'match_wrong') {
    itemId = e.leftItemId;
    correct = 0;
  } else return;
  const base = { itemId, sourceLang: e.sourceLang, relation: e.relation };
  const k = keyOf(base);
  const t = into.get(k) ?? { ...base, attempts: 0, correct: 0, rtSumMs: 0 };
  t.attempts += 1;
  t.correct += correct;
  t.rtSumMs += e.rtMs;
  into.set(k, t);
}

function mergeTotals(into: Map<string, Totals>, rows: readonly Totals[]): void {
  for (const r of rows) {
    const k = keyOf(r);
    const t = into.get(k);
    if (t) {
      t.attempts += r.attempts;
      t.correct += r.correct;
      t.rtSumMs += r.rtSumMs;
    } else into.set(k, { ...r });
  }
}

const toAggregate = (t: Totals): Aggregate => ({
  itemId: t.itemId,
  sourceLang: t.sourceLang,
  relation: t.relation,
  attempts: t.attempts,
  correct: t.correct,
  meanRtMs: t.attempts === 0 ? 0 : t.rtSumMs / t.attempts,
});

/** Aggregates of a full event history: the reference the rolled-over log must match. */
export function aggregateEvents(events: readonly LogEvent[]): Aggregate[] {
  const m = new Map<string, Totals>();
  for (const e of events) fold(m, e);
  return [...m.values()].map(toAggregate);
}

export const CSV_COLUMNS = [
  'ts',
  'sessionId',
  'gameId',
  'type',
  'level',
  'itemId',
  'leftItemId',
  'rightItemId',
  'sourceLang',
  'relation',
  'rtMs',
  'score',
  'timeMs',
  'mistakes',
  'hints',
] as const;

export function csvEscape(value: unknown): string {
  if (value === undefined || value === null) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export interface LearningLogOptions {
  clock: Clock;
  sessionId: string;
  /** Max events kept; older ones roll into per-item aggregates. Default 5000. */
  cap?: number;
  /** Persistence; defaults to localStorage with a memory fallback. */
  storage?: StoreOptions;
  /** Test seam: replace the store. */
  store?: Store<LogState>;
}

export interface LearningLog {
  log(event: LogEventInput): void;
  events(): readonly LogEvent[];
  aggregates(): Aggregate[];
  exportJson(): string;
  exportCsv(): string;
  clear(): void;
}

export function createLearningLog(options: LearningLogOptions): LearningLog {
  const cap = Math.max(1, Math.floor(options.cap ?? DEFAULT_CAP));
  const store =
    options.store ??
    createStore<LogState>(
      NAMESPACE,
      { version: 1, default: { events: [], rolled: [] }, validate: isState },
      {},
      options.storage,
    );

  const aggregates = (): Aggregate[] => {
    const { events, rolled } = store.get();
    const m = new Map<string, Totals>();
    mergeTotals(m, rolled);
    for (const e of events) fold(m, e);
    return [...m.values()].map(toAggregate);
  };

  return {
    log(input) {
      const event = { ...input, ts: options.clock.now(), sessionId: options.sessionId } as LogEvent;
      store.update(({ events, rolled }) => {
        const next = [...events, event];
        const over = next.length - cap;
        if (over <= 0) return { events: next, rolled };
        const m = new Map<string, Totals>();
        mergeTotals(m, rolled);
        for (const e of next.slice(0, over)) fold(m, e);
        return { events: next.slice(over), rolled: [...m.values()] };
      });
    },
    events: () => store.get().events,
    aggregates,
    exportJson: () =>
      JSON.stringify({ events: store.get().events, aggregates: aggregates() }, null, 2),
    exportCsv() {
      const rows = store.get().events.map((e) => {
        const rec = e as unknown as Record<string, unknown>;
        return CSV_COLUMNS.map((c) => csvEscape(rec[c])).join(',');
      });
      return [CSV_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
    },
    clear: () => store.set({ events: [], rolled: [] }),
  };
}
