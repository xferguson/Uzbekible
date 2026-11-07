/**
 * CLI plumbing for the balance simulator: flag parsing, game lookup and the markdown table.
 * Kept out of `core/sim` (no CLI concerns in core). Run via `npm run sim`.
 */
import { PROFILES, simulate, type LevelRow, type SimGame } from '../src/core/sim/index.ts';

export function formatTable(rows: readonly LevelRow[]): string {
  const head =
    '| Level | Profile | Runs | Completion | Median time (s) | Median score | Stars 0/1/2/3 |';
  const rule = '| ---: | --- | ---: | ---: | ---: | ---: | --- |';
  const body = rows.map((r) => {
    const time = r.medianTimeMs === null ? '–' : (r.medianTimeMs / 1000).toFixed(1);
    return `| ${r.level} | ${r.profile} | ${r.runs} | ${(r.completionRate * 100).toFixed(0)}% | ${time} | ${r.medianScore} | ${r.stars.join('/')} |`;
  });
  return [head, rule, ...body].join('\n') + '\n';
}

export interface CliArgs {
  game: string;
  levels: number[];
  profiles: string[];
  runs: number;
  seed: number;
}

function parseInt10(flag: string, text: string): number {
  if (!/^\d+$/.test(text)) throw new RangeError(`${flag}: expected a whole number, got "${text}"`);
  return Number(text);
}

function parseLevels(text: string): number[] {
  const m = /^(\d+)(?:-(\d+))?$/.exec(text);
  const from = m ? Number(m[1]) : NaN;
  const to = m ? Number(m[2] ?? m[1]) : NaN;
  if (!m || from > to)
    throw new RangeError(`levels: expected "n" or "a-b" with a <= b, got "${text}"`);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = {
    game: '',
    levels: parseLevels('1-5'),
    profiles: Object.keys(PROFILES),
    runs: 100,
    seed: 1,
  };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i] as string;
    const value = argv[i + 1];
    if (value === undefined) throw new RangeError(`${flag}: missing value`);
    if (flag === '--game') out.game = value;
    else if (flag === '--levels') out.levels = parseLevels(value);
    else if (flag === '--profiles') out.profiles = value.split(',').filter(Boolean);
    else if (flag === '--runs') out.runs = parseInt10('runs', value);
    else if (flag === '--seed') out.seed = parseInt10('seed', value);
    else throw new RangeError(`Unknown flag ${flag}`);
  }
  if (!out.game) throw new RangeError('--game <id> is required');
  return out;
}

/** A game, or a factory for games whose scoring depends on the level (par scales with pair count). */
export type SimGameSource =
  SimGame<unknown, unknown> | ((level: number) => SimGame<unknown, unknown>);

export function runCli(argv: readonly string[], games: Record<string, SimGameSource>): string {
  const args = parseArgs(argv);
  const game = games[args.game];
  if (!game)
    throw new RangeError(
      `Unknown game "${args.game}". Known: ${Object.keys(games).join(', ') || '(none)'}`,
    );
  const rows = args.levels.flatMap((level) =>
    simulate({
      game: typeof game === 'function' ? game(level) : game,
      profiles: args.profiles,
      levels: [level],
      runs: args.runs,
      seed: args.seed,
    }),
  );
  return formatTable(rows);
}
