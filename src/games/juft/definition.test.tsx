import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createFakeClock } from '@core/clock';
import { loadItems } from '@core/content/index.ts';
import { createLearningLog } from '@core/learning-log';
import { createMemoryBackend } from '@core/storage';
import { GameShell } from '../../shell/GameShell.tsx';
import { createProgressStore } from '../../shell/progress.ts';
import { levelContext } from '../sim-adapter.ts';
import type { GameSettings } from '../types.ts';
import { createJuftDefinition } from './definition.ts';

const items = loadItems(JSON.parse(readFileSync('public/content/items.v1.json', 'utf8')));
const juft = createJuftDefinition(items);
const tr: GameSettings = { sourceLangs: ['tr'], script: 'latn' };

function setup(level: number, settings: GameSettings = tr) {
  const clock = createFakeClock(1_000);
  const backend = createMemoryBackend();
  const progress = createProgressStore('juft', { backend });
  const log = createLearningLog({ clock, sessionId: 's', storage: { backend } });
  const onNext = vi.fn();
  const view = render(
    <GameShell
      definition={juft}
      level={level}
      settings={settings}
      history={[]}
      clock={clock}
      progress={progress}
      log={log}
      countdownMs={3_000}
      onNext={onNext}
      onMap={vi.fn()}
    />,
  );
  const advance = (ms: number) =>
    act(() => {
      clock.advance(ms);
      vi.advanceTimersByTime(ms);
    });
  const spec = juft.levels(levelContext('juft', level, settings, []));
  const tile = (side: 'left' | 'right', id: string) =>
    view.container.querySelector<HTMLElement>(
      `[data-testid="col-${side}"] [data-tile-id="${id}"] button`,
    )!;
  const click = (side: 'left' | 'right', id: string) => act(() => void fireEvent.click(tile(side, id)));
  const playAll = (msPerPair = 2_000) => {
    for (const p of spec.params.pairs) {
      advance(msPerPair);
      click('left', p.id);
      click('right', p.id);
    }
  };
  return { advance, spec, click, playAll, progress, log, onNext, view };
}

describe('Juft definition', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is the juft game with Uzbek titles and a per-level scoring config', () => {
    expect(juft.id).toBe('juft');
    expect(juft.title.uzLatn).toBeTruthy();
    expect(juft.title.uzCyrl).toBeTruthy();
    const a = juft.scoringFor!(juft.levels(levelContext('juft', 1, tr, [])), tr);
    const b = juft.scoringFor!(juft.levels(levelContext('juft', 110, tr, [])), tr);
    expect(b.parMs).toBeGreaterThan(a.parMs);
  });

  it('plays level 1, saves the best score and unlocks level 2; then plays level 2', () => {
    const one = setup(1);
    one.advance(3_000);
    expect(one.spec.params.pairs).toHaveLength(1);
    one.playAll();
    expect(screen.getByRole('img', { name: /\/3/ })).toBeInTheDocument();
    expect(one.progress.get().unlocked).toBe(2);
    expect(one.progress.get().best[1]!.score).toBeGreaterThan(0);
    act(() => screen.getByRole('button', { name: /keyingi/i }).click());
    expect(one.onNext).toHaveBeenCalledOnce();
    one.view.unmount();

    const two = setup(2);
    two.advance(3_000);
    two.playAll();
    expect(two.progress.get().unlocked).toBe(3);
    expect(two.progress.get().best[2]).toBeDefined();
  });

  it('emits learning-log events per spec', () => {
    const t = setup(16);
    t.advance(3_000);
    const [a, b] = t.spec.params.pairs;
    t.advance(1_500);
    t.click('left', a!.id);
    t.click('right', b!.id); // wrong
    t.advance(1_000);
    t.click('left', a!.id);
    t.click('right', a!.id); // right
    const events = t.log.events();
    expect(events.map((e) => e.type)).toEqual(['level_start', 'match_wrong', 'match_correct']);
    expect(events[1]).toMatchObject({
      gameId: 'juft',
      leftItemId: a!.id,
      rightItemId: b!.id,
      sourceLang: a!.source.lang,
      relation: a!.source.relation,
      rtMs: 1_500,
    });
    expect(events[2]).toMatchObject({
      itemId: a!.id,
      sourceLang: a!.source.lang,
      relation: a!.source.relation,
      rtMs: 1_000,
    });
  });

  it('logs a hint and finishes with level_complete', () => {
    const t = setup(1);
    t.advance(3_000);
    const [p] = t.spec.params.pairs;
    const left = t.view.container.querySelector<HTMLElement>(
      `[data-testid="col-left"] [data-tile-id="${p!.id}"] button`,
    )!;
    act(() => void fireEvent.keyDown(left, { key: 'h' }));
    t.playAll();
    const types = t.log.events().map((e) => e.type);
    expect(types).toEqual(['level_start', 'hint_used', 'match_correct', 'level_complete']);
  });

  it('respects the source-language setting', () => {
    const fa = juft.levels(levelContext('juft', 20, { sourceLangs: ['fa'], script: 'latn' }, []));
    for (const p of fa.params.pairs) expect(p.source.lang).toBe('fa');
  });

  it('scores Cyrillic higher than Latin for the same play', () => {
    const latn = setup(1);
    latn.advance(3_000);
    latn.playAll();
    const latnScore = latn.progress.get().best[1]!.score;
    latn.view.unmount();
    const cyrl = setup(1, { sourceLangs: ['tr'], script: 'cyrl' });
    cyrl.advance(3_000);
    cyrl.playAll();
    expect(cyrl.progress.get().best[1]!.score).toBeGreaterThan(latnScore);
  });
});
