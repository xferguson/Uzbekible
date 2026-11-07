// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STATES } from '../e2e/states.ts';
import {
  checkFrames,
  compareHtml,
  framesFor,
  parseArgs,
  selectStates,
  shotName,
  VIEWPORTS,
  // @ts-expect-error plain JS module without types
} from './shots.mjs';

const root = join(import.meta.dirname, '..');
const frames = JSON.parse(readFileSync(join(root, 'docs/design/frames.json'), 'utf8'));
const exists = (p: string) => existsSync(join(root, p));

describe('state → frame mapping (docs/design/frames.json)', () => {
  it('every state has an entry, every entry is a state, every referenced frame file exists', () => {
    expect(checkFrames(STATES, frames, exists)).toEqual([]);
  });

  it('state ids are unique kebab-case', () => {
    const ids = STATES.map((s: { id: string }) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every game folder with a definition has screen states (new games add theirs)', () => {
    const games = readdirSync(join(root, 'src/games'), { withFileTypes: true })
      .filter(
        (d) => d.isDirectory() && existsSync(join(root, 'src/games', d.name, 'definition.ts')),
      )
      .map((d) => d.name);
    expect(games.length).toBeGreaterThan(0);
    for (const g of games)
      expect(STATES.some((s: { game: string | null }) => s.game === g)).toBe(true);
  });

  it('reports missing states, stale entries and missing files', () => {
    const states = [
      { id: 'home', game: null },
      { id: 'pause', game: 'juft' },
    ];
    const f = {
      states: {
        home: { phone: ['a-{scheme}.png'], desktop: [] },
        gone: { phone: [], desktop: [] },
      },
    };
    const problems = checkFrames(states, f, (p: string) => p === 'a-light.png');
    expect(problems).toEqual([
      'pause: no entry in frames.json',
      'gone: entry in frames.json but no such state',
      'home: frame file a-dark.png does not exist',
    ]);
  });
});

describe('shots runner helpers', () => {
  it('covers 360×780, 390×844 and 1280×800', () => {
    expect(VIEWPORTS.map((v: { width: number }) => v.width)).toEqual([360, 390, 1280]);
  });

  it('parses --states and --games filters', () => {
    expect(parseArgs([])).toEqual({ states: null, games: null, url: null });
    expect(parseArgs(['--states', 'map,results'])).toMatchObject({ states: ['map', 'results'] });
    expect(parseArgs(['--states=home', '--games', 'juft'])).toMatchObject({
      states: ['home'],
      games: ['juft'],
    });
    expect(parseArgs(['--url', 'http://localhost:5173/Uzbekible/'])).toMatchObject({
      url: 'http://localhost:5173/Uzbekible/',
    });
    expect(() => parseArgs(['--nope'])).toThrow(/--nope/);
  });

  it('--states matches ids and id prefixes; --games matches game ids (shell for shell screens)', () => {
    const all = [
      { id: 'home', game: null },
      { id: 'map-early', game: 'juft' },
      { id: 'map-late', game: 'juft' },
      { id: 'mapx', game: 'other' },
    ];
    const ids = (r: { id: string }[]) => r.map((s) => s.id);
    expect(ids(selectStates(all, { states: ['map'], games: null }))).toEqual([
      'map-early',
      'map-late',
    ]);
    expect(ids(selectStates(all, { states: null, games: ['shell'] }))).toEqual(['home']);
    expect(ids(selectStates(all, { states: null, games: null }))).toHaveLength(4);
  });

  it('names shots <state>-<width>-<scheme>.png', () => {
    expect(shotName('home', 390, 'dark')).toBe('home-390-dark.png');
  });

  it('picks phone frames below the desktop width, filling in the scheme', () => {
    const f = { states: { home: { phone: ['p-{scheme}.png'], desktop: ['d-{scheme}.png'] } } };
    expect(framesFor(f, 'home', 360, 'light')).toEqual(['p-light.png']);
    expect(framesFor(f, 'home', 1280, 'dark')).toEqual(['d-dark.png']);
    expect(framesFor(f, 'missing', 1280, 'dark')).toEqual([]);
  });

  it('compare page pairs app and mockup and flags missing frames and failed states', () => {
    const html = compareHtml([
      {
        state: { id: 'home', title: 'Home' },
        width: 390,
        scheme: 'light',
        shot: 'home-390-light.png',
        frames: ['frames/x.png'],
      },
      {
        state: { id: 'pause', title: 'Pause' },
        width: 1280,
        scheme: 'dark',
        shot: 'pause-1280-dark.png',
        frames: [],
      },
      {
        state: { id: 'fail', title: 'Fail' },
        width: 360,
        scheme: 'dark',
        shot: null,
        frames: [],
        error: 'boom <b>',
      },
    ]);
    expect(html).toContain('src="home-390-light.png"');
    expect(html).toContain('src="frames/x.png"');
    expect(html).toMatch(/No mockup frame/);
    expect(html).toContain('boom &lt;b&gt;');
    expect(html).toMatch(/2 missing frames/);
  });
});
