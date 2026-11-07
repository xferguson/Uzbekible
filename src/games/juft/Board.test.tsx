import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeClock, type FakeClock } from '@core/clock';
import { createRng } from '@core/random';
import { createSession, type GameEvent, type Session, type SessionState } from '@core/session';
import type { LevelSpec } from '../types.ts';
import { Board, boardMetrics, HINT_HOLD_MS } from './Board.tsx';
import { createJuftRules, type JuftAction, type JuftEvent, type JuftState } from './rules.ts';
import type { JuftPair, JuftParams } from './levels.ts';

const WORDS: [string, string, string, string][] = [
  ['göz', 'koʻz', 'кўз', 'eye'],
  ['elma', 'olma', 'олма', 'apple'],
  ['su', 'suv', 'сув', 'water'],
  ['ev', 'uy', 'уй', 'house'],
  ['преподаватель', 'oʻqituvchilar', 'ўқитувчилар', 'teacher'],
  ['kitap', 'kitob', 'китоб', 'book'],
  ['gün', 'kun', 'кун', 'day'],
  ['yol', 'yoʻl', 'йўл', 'road'],
  ['dost', 'doʻst', 'дўст', 'friend'],
  ['baş', 'bosh', 'бош', 'head'],
  ['el', 'qoʻl', 'қўл', 'hand'],
  ['ay', 'oy', 'ой', 'moon'],
];

function pairsOf(n: number, lang: JuftPair['source']['lang'] = 'tr'): JuftPair[] {
  return WORDS.slice(0, n).map(([src, latn, cyrl, glossEn], i) => ({
    id: `p${i}`,
    source: { lang, text: src, relation: 'turkic-cognate' },
    uz: { latn, cyrl },
    glossEn,
    transparency: 0.5,
    suffixed: false,
  }));
}

interface Harness {
  clock: FakeClock;
  session: Session<JuftState, JuftAction, JuftEvent | GameEvent>;
  dispatch: ReturnType<typeof vi.fn>;
}

function setup(
  n: number,
  opts: {
    script?: 'latn' | 'cyrl';
    langs?: ('tr' | 'ru' | 'fa' | 'ar')[];
    lang?: 'tr' | 'fa';
    hard?: boolean;
  } = {},
) {
  const clock = createFakeClock();
  const pairs = pairsOf(n, opts.lang);
  const rules = createJuftRules({ pairIds: pairs.map((p) => p.id), rng: createRng(7) });
  const session = createSession({ rules, lives: 3, countdownMs: 0, clock }) as Harness['session'];
  session.start();
  const spec: LevelSpec<JuftParams> = {
    level: 1,
    seed: 's',
    lives: 3,
    params: { pairs, parMs: 60_000, hard: opts.hard ?? false, chapter: 1 },
  };
  const dispatch = vi.fn((a: JuftAction) => session.dispatch(a));
  const settings = { sourceLangs: opts.langs ?? ['tr'], script: opts.script ?? 'latn' } as const;
  function Live() {
    return (
      <Board
        spec={spec}
        settings={settings}
        state={session.getState() as SessionState<JuftState>}
        dispatch={dispatch}
        subscribe={session.subscribe as never}
        clock={clock}
      />
    );
  }
  const view = render(<Live />);
  const rerender = () => view.rerender(<Live />);
  const column = (side: 'left' | 'right') => screen.getByTestId(`col-${side}`);
  const tile = (side: 'left' | 'right', text: string) =>
    within(column(side)).getByRole('button', { name: new RegExp(`^${text}`) });
  return { clock, session, dispatch, pairs, rerender, column, tile, view };
}

describe('Juft Board', () => {
  it('renders two columns: source left, Uzbek right, each pair once, in shuffled order', () => {
    const t = setup(6);
    expect(within(t.column('left')).getAllByRole('button')).toHaveLength(6);
    expect(within(t.column('right')).getAllByRole('button')).toHaveLength(6);
    expect(t.tile('left', 'göz')).toBeInTheDocument();
    expect(t.tile('right', 'koʻz')).toBeInTheDocument();
    const state = t.session.getState().game;
    const order = within(t.column('left'))
      .getAllByRole('button')
      .map((b) => b.closest('[data-tile-id]')?.getAttribute('data-tile-id'));
    expect(order).toEqual(state.left);
  });

  it('a correct pair dispatches select twice and renders the matched state, then a socket', async () => {
    const t = setup(3);
    const user = userEvent.setup();
    await user.click(t.tile('left', 'göz'));
    t.rerender();
    expect(t.tile('left', 'göz')).toHaveAttribute('data-state', 'selected');
    await user.click(t.tile('right', 'koʻz'));
    t.rerender();
    expect(t.dispatch).toHaveBeenCalledTimes(2);
    expect(t.dispatch).toHaveBeenNthCalledWith(1, { type: 'select', side: 'left', tileId: 'p0' });
    expect(t.dispatch).toHaveBeenNthCalledWith(2, { type: 'select', side: 'right', tileId: 'p0' });
    expect(t.tile('left', 'göz')).toHaveAttribute('data-state', 'matched');
    expect(t.tile('right', 'koʻz')).toHaveAttribute('data-state', 'matched');
    act(() => t.clock.advance(700));
    expect(within(t.column('left')).queryByRole('button', { name: /göz/ })).toBeNull();
    expect(within(t.column('left')).getAllByTestId('socket')).toHaveLength(1);
    expect(within(t.column('left')).getAllByRole('button')).toHaveLength(2);
  });

  it('a wrong pair shows the cracked state on both tiles, then recovers', async () => {
    const t = setup(3);
    const user = userEvent.setup();
    await user.click(t.tile('left', 'göz'));
    await user.click(t.tile('right', 'olma'));
    t.rerender();
    expect(t.tile('left', 'göz')).toHaveAttribute('data-state', 'wrong');
    expect(t.tile('right', 'olma')).toHaveAttribute('data-state', 'wrong');
    act(() => t.clock.advance(600));
    expect(t.tile('left', 'göz')).toHaveAttribute('data-state', 'idle');
    expect(t.tile('right', 'olma')).toHaveAttribute('data-state', 'idle');
  });

  it('keeps other tiles live during an animation (input is never locked)', async () => {
    const t = setup(3);
    const user = userEvent.setup();
    await user.click(t.tile('left', 'göz'));
    await user.click(t.tile('right', 'koʻz'));
    t.rerender();
    await user.click(t.tile('left', 'elma'));
    expect(t.dispatch).toHaveBeenCalledTimes(3);
  });

  it('renders no English anywhere without a hint', () => {
    setup(12);
    for (const [, , , gloss] of WORDS) expect(screen.queryByText(gloss)).toBeNull();
    expect(document.body.textContent).not.toMatch(/\b(eye|apple|water|teacher)\b/);
  });

  it('long-press shows the gloss for 1500 ms, dispatches hint and never selects', () => {
    const t = setup(3);
    const tile = t.tile('left', 'göz');
    fireEvent.pointerDown(tile, { clientX: 1, clientY: 1 });
    act(() => t.clock.advance(HINT_HOLD_MS + 20));
    expect(t.dispatch).toHaveBeenCalledWith({ type: 'hint', tileId: 'p0' });
    expect(screen.getByText('eye')).toBeInTheDocument();
    fireEvent.pointerUp(tile);
    fireEvent.click(tile);
    expect(t.dispatch).toHaveBeenCalledTimes(1);
    act(() => t.clock.advance(1400));
    expect(screen.getByText('eye')).toBeInTheDocument();
    act(() => t.clock.advance(200));
    expect(screen.queryByText('eye')).toBeNull();
  });

  it('the H key hints the focused tile', async () => {
    const t = setup(3);
    const user = userEvent.setup();
    t.tile('right', 'olma').focus();
    await user.keyboard('h');
    expect(t.dispatch).toHaveBeenCalledWith({ type: 'hint', tileId: 'p1' });
    expect(screen.getByText('apple')).toBeInTheDocument();
  });

  it('shows Uzbek in the chosen script and source text in its own script', () => {
    const t = setup(3, { script: 'cyrl' });
    expect(t.tile('right', 'кўз')).toBeInTheDocument();
    expect(t.tile('left', 'göz')).toHaveTextContent('göz');
  });

  it('Persian source tiles are RTL, still in the left column', () => {
    setup(1, { lang: 'fa' });
    const word = screen.getByText('göz');
    expect(word).toHaveAttribute('dir', 'rtl');
    expect(word).toHaveAttribute('lang', 'fa');
  });

  it('badges source tiles with the language only when several are enabled', () => {
    const single = setup(2);
    expect(within(single.column('left')).queryByTestId('lang-badge')).toBeNull();
    single.view.unmount();
    const mixed = setup(2, { langs: ['tr', 'ru'] });
    expect(within(mixed.column('left')).getAllByTestId('lang-badge')[0]).toHaveTextContent('TR');
    expect(within(mixed.column('right')).queryByTestId('lang-badge')).toBeNull();
  });

  it('shows the "new pattern" glow and tag only on a hard one-pair board', () => {
    const plain = setup(1);
    expect(plain.column('left')).not.toHaveAttribute('data-fresh');
    expect(screen.queryByText('Yangi naqsh')).toBeNull();
    plain.view.unmount();
    const hard = setup(1, { hard: true });
    expect(hard.column('left')).toHaveAttribute('data-fresh');
    expect(screen.getByText('Yangi naqsh')).toBeInTheDocument();
  });
});

describe('boardMetrics', () => {
  it.each([1, 4, 8, 9])('%i pairs: roomy gaps and 20px type', (n) => {
    expect(boardMetrics(n)).toMatchObject({ gap: 10, fontSize: 20, dense: false });
  });
  it.each([10, 11, 12])('%i pairs: 6px gaps and 17px type', (n) => {
    expect(boardMetrics(n)).toMatchObject({ gap: 6, fontSize: 17, dense: true });
  });
  it('never allows tiles under 44px or over 96px', () => {
    for (let n = 1; n <= 12; n++) {
      const m = boardMetrics(n);
      expect(m.minTile).toBe(44);
      expect(m.maxTile).toBe(96);
    }
  });
  it('a 12-pair column fits a 390 x 844 phone at 44px+ per tile', () => {
    const m = boardMetrics(12);
    const need = 12 * m.minTile + 11 * m.gap;
    expect(need).toBeLessThanOrEqual(844 - 140);
  });
  it('lays out 12 pairs with CSS variables on both columns', () => {
    setup(12);
    for (const side of ['left', 'right'] as const) {
      const col = screen.getByTestId(`col-${side}`);
      expect(col.style.getPropertyValue('--n')).toBe('12');
      expect(col.style.getPropertyValue('--gap')).toBe('6px');
      expect(col.style.getPropertyValue('--fs')).toBe('17px');
    }
  });
  it('long words wrap inside the tile instead of overflowing', () => {
    const t = setup(6);
    const word = within(t.column('left')).getByText('преподаватель');
    expect(word.className).toMatch(/word/);
  });
});
