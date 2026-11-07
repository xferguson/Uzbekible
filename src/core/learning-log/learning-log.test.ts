import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../clock/index.ts';
import { createMemoryBackend } from '../storage/index.ts';
import {
  CSV_COLUMNS,
  aggregateEvents,
  createLearningLog,
  csvEscape,
  type LogEventInput,
} from './index.ts';

const make = (cap?: number, backend = createMemoryBackend()) => {
  const clock = createFakeClock(1000);
  const log = createLearningLog({ clock, sessionId: 's1', cap, storage: { backend } });
  return { clock, log, backend };
};
const ok = (itemId: string, rtMs: number): LogEventInput => ({
  type: 'match_correct',
  gameId: 'juft',
  itemId,
  sourceLang: 'tr',
  relation: 'turkic-cognate',
  rtMs,
});

describe('learning log', () => {
  it('stamps ts, sessionId and gameId', () => {
    const { clock, log } = make();
    log.log(ok('a', 5));
    clock.advance(50);
    log.log({ type: 'level_start', gameId: 'juft' });
    expect(log.events().map((e) => [e.ts, e.sessionId, e.gameId])).toEqual([
      [1000, 's1', 'juft'],
      [1050, 's1', 'juft'],
    ]);
  });

  it('persists across instances', () => {
    const { log, backend } = make();
    log.log(ok('a', 5));
    expect(make(undefined, backend).log.events()).toHaveLength(1);
  });

  it('caps events and rolls the oldest into aggregates', () => {
    const { log } = make(2);
    log.log(ok('a', 100));
    log.log(ok('a', 300));
    log.log(ok('b', 50));
    expect(log.events()).toHaveLength(2);
    const a = log.aggregates().find((x) => x.itemId === 'a');
    expect(a).toMatchObject({ attempts: 2, correct: 2, meanRtMs: 200 });
  });

  it('counts wrong matches as attempts on the left item', () => {
    const { log } = make();
    log.log(ok('a', 100));
    log.log({
      type: 'match_wrong',
      gameId: 'juft',
      leftItemId: 'a',
      rightItemId: 'b',
      sourceLang: 'tr',
      relation: 'turkic-cognate',
      rtMs: 300,
    });
    expect(log.aggregates()).toEqual([
      {
        itemId: 'a',
        sourceLang: 'tr',
        relation: 'turkic-cognate',
        attempts: 2,
        correct: 1,
        meanRtMs: 200,
      },
    ]);
  });

  it('keeps languages and relations separate and ignores non-attempts', () => {
    const { log } = make();
    log.log(ok('a', 1));
    log.log({ ...ok('a', 1), sourceLang: 'ru', relation: 'russian-loan' } as LogEventInput);
    log.log({ type: 'hint_used', gameId: 'juft', itemId: 'a' });
    log.log({ type: 'level_failed', gameId: 'juft' });
    expect(log.aggregates()).toHaveLength(2);
  });

  it('aggregateEvents of nothing is empty', () => {
    expect(aggregateEvents([])).toEqual([]);
  });

  it('clear empties events and aggregates', () => {
    const { log } = make(1);
    log.log(ok('a', 1));
    log.log(ok('a', 1));
    log.clear();
    expect(log.events()).toEqual([]);
    expect(log.aggregates()).toEqual([]);
  });

  it('exports JSON with events and aggregates', () => {
    const { log } = make();
    log.log(ok('a', 7));
    const parsed = JSON.parse(log.exportJson());
    expect(parsed.events).toHaveLength(1);
    expect(parsed.aggregates[0]).toMatchObject({ itemId: 'a', attempts: 1 });
  });
});

describe('CSV export', () => {
  it('has a stable header and one row per event', () => {
    const { log } = make();
    log.log(ok('a', 7));
    log.log({
      type: 'level_complete',
      gameId: 'juft',
      score: 90,
      timeMs: 5000,
      mistakes: 1,
      hints: 0,
    });
    const lines = log.exportCsv().trimEnd().split('\r\n');
    expect(lines[0]).toBe(CSV_COLUMNS.join(','));
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('1000,s1,juft,match_correct,,a,,,tr,turkic-cognate,7,,,,');
    expect(lines[2]).toBe('1000,s1,juft,level_complete,,,,,,,,90,5000,1,0');
  });

  it('escapes commas, quotes and newlines; leaves RTL text intact', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('x\ny')).toBe('"x\ny"');
    expect(csvEscape('کتاب')).toBe('کتاب');
    expect(csvEscape('كتاب,2')).toBe('"كتاب,2"');
    expect(csvEscape(undefined)).toBe('');
  });

  it('round-trips awkward item ids', () => {
    const { log } = make();
    log.log(ok('کتاب, "kitob"', 1));
    expect(log.exportCsv()).toContain('"کتاب, ""kitob"""');
  });
});

describe('learning log with a pre-rolled history', () => {
  const row = (attempts: number, correct: number, rtSumMs: number) => ({
    itemId: 'a',
    sourceLang: 'tr',
    relation: 'turkic-cognate',
    attempts,
    correct,
    rtSumMs,
  });

  it('merges duplicate rolled rows and reports a zero mean for zero attempts', () => {
    const backend = createMemoryBackend();
    backend.setItem(
      'uzbekible:v1:learning-log',
      JSON.stringify({
        events: [],
        rolled: [row(2, 1, 20), row(2, 2, 40), { ...row(0, 0, 0), itemId: 'z' }],
      }),
    );
    const { log } = make(5, backend);
    expect(log.aggregates()).toEqual([
      {
        itemId: 'a',
        sourceLang: 'tr',
        relation: 'turkic-cognate',
        attempts: 4,
        correct: 3,
        meanRtMs: 15,
      },
      {
        itemId: 'z',
        sourceLang: 'tr',
        relation: 'turkic-cognate',
        attempts: 0,
        correct: 0,
        meanRtMs: 0,
      },
    ]);
  });
});
