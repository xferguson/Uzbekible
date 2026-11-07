import fc from 'fast-check';
import { describe, it } from 'vitest';
import { createFakeClock } from '../clock/index.ts';
import { createMemoryBackend } from '../storage/index.ts';
import { aggregateEvents, createLearningLog, type LogEvent, type LogEventInput } from './index.ts';

const opts = { seed: 20240607, numRuns: 200 };
const key = (a: { itemId: string; sourceLang: string; relation: string }) =>
  `${a.itemId}|${a.sourceLang}|${a.relation}`;

const input: fc.Arbitrary<LogEventInput> = fc.oneof(
  fc.record({
    type: fc.constant('match_correct' as const),
    gameId: fc.constant('juft'),
    itemId: fc.constantFrom('a', 'b', 'c'),
    sourceLang: fc.constantFrom('tr' as const, 'ru' as const),
    relation: fc.constantFrom('turkic-cognate' as const, 'russian-loan' as const),
    rtMs: fc.integer({ min: 0, max: 20000 }),
  }),
  fc.record({
    type: fc.constant('match_wrong' as const),
    gameId: fc.constant('juft'),
    leftItemId: fc.constantFrom('a', 'b', 'c'),
    rightItemId: fc.constantFrom('a', 'b', 'c'),
    sourceLang: fc.constantFrom('tr' as const, 'ru' as const),
    relation: fc.constantFrom('turkic-cognate' as const, 'russian-loan' as const),
    rtMs: fc.integer({ min: 0, max: 20000 }),
  }),
  fc.record({
    type: fc.constant('hint_used' as const),
    gameId: fc.constant('juft'),
    itemId: fc.constant('a'),
  }),
);

describe('learning-log properties', () => {
  it('aggregates after rollover equal aggregates of the full history', () => {
    fc.assert(
      fc.property(
        fc.array(input, { maxLength: 60 }),
        fc.integer({ min: 1, max: 10 }),
        (inputs, cap) => {
          const clock = createFakeClock(0);
          const log = createLearningLog({
            clock,
            sessionId: 's',
            cap,
            storage: { backend: createMemoryBackend() },
          });
          const full: LogEvent[] = [];
          for (const i of inputs) {
            log.log(i);
            full.push({ ...i, ts: 0, sessionId: 's' } as LogEvent);
            clock.advance(1);
          }
          const sort = <T extends { itemId: string; sourceLang: string; relation: string }>(
            xs: T[],
          ) => [...xs].sort((x, y) => key(x).localeCompare(key(y)));
          const got = sort(log.aggregates());
          const want = sort(aggregateEvents(full));
          return log.events().length <= cap && JSON.stringify(got) === JSON.stringify(want);
        },
      ),
      opts,
    );
  });
});
