import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeClock, type FakeClock } from '@core/clock';
import { createRng } from '@core/random';
import { createSession, type GameEvent, type Session, type SessionState } from '@core/session';
import type { LevelSpec } from '../types.ts';
import { Board, HINT_HOLD_MS, WRONG_MS } from './Board.tsx';
import type { BankTile, ImloMode, ImloPair, ImloParams } from './levels.ts';
import { createImloRules, type ImloAction, type ImloEvent, type ImloState } from './rules.ts';

function pair(
  itemId: string,
  clue: string,
  source: string[],
  uz: string[],
  lang: ImloPair['source']['lang'] = 'tr',
  extra: string[] = [],
): ImloPair {
  const bank: BankTile[] = [
    ...source.map((letter, i) => ({ id: `s${i}`, letter, origin: 'source' as const })),
    ...uz.map((letter, i) => ({ id: `u${i}`, letter, origin: 'uz' as const })),
    ...extra.map((letter, i) => ({ id: `d${i}`, letter, origin: 'distractor' as const })),
  ];
  return {
    itemId,
    clue,
    source: { lang, text: source.join(''), letters: source },
    uz: { text: uz.join(''), letters: uz },
    bank,
  };
}

const NAME = pair('name', 'name', [...'isim'], [...'ism']);
const CITY = pair('city', 'city', [...'şehir'], ['sh', 'a', 'h', 'a', 'r']);
const TWO = pair('two', 'two', [...'iki'], [...'ikki']);

interface Opts {
  pairs?: ImloPair[];
  mode?: ImloMode;
  script?: 'latn' | 'cyrl';
}

function setup(opts: Opts = {}) {
  const clock = createFakeClock();
  const pairs = opts.pairs ?? [NAME, CITY];
  const rules = createImloRules({ pairs, rng: createRng(7) });
  const session = createSession({ rules, lives: 3, countdownMs: 0, clock }) as Session<
    ImloState,
    ImloAction,
    ImloEvent | GameEvent
  >;
  session.start();
  const spec: LevelSpec<ImloParams> = {
    level: 1,
    seed: 's',
    lives: 3,
    params: { pairs, mode: opts.mode ?? 'oson' },
  };
  const dispatch = vi.fn((a: ImloAction) => session.dispatch(a));
  const settings = { sourceLangs: ['tr'], script: opts.script ?? 'latn' } as const;
  function Live() {
    return (
      <Board
        spec={spec}
        settings={settings}
        state={session.getState() as SessionState<ImloState>}
        dispatch={dispatch}
        subscribe={session.subscribe as never}
        clock={clock}
      />
    );
  }
  const view = render(<Live />);
  const rerender = () => view.rerender(<Live />);
  const row = (side: 'source' | 'uz') => screen.getByTestId(`row-${side}`);
  const bank = () => screen.getByTestId('bank');
  /** Press the first free bank tile showing `letter`, then redraw. */
  const tap = async (user: ReturnType<typeof userEvent.setup>, letter: string) => {
    const btn = within(bank())
      .getAllByRole('button', { name: letter })
      .find((b) => !b.hasAttribute('aria-disabled'));
    await user.click(btn!);
    rerender();
  };
  const star = () => screen.getByRole('button', { name: /^(Tekshir|Текшир)/ });
  return { clock: clock as FakeClock, session, dispatch, rerender, row, bank, tap, star, view };
}

describe('Imlo Board', () => {
  it('spells both words by tapping and the next clue shows after Tekshir', async () => {
    const t = setup();
    const user = userEvent.setup();
    expect(screen.getByText('name')).toBeInTheDocument();
    await user.click(t.row('source'));
    t.rerender();
    for (const l of 'isim') await t.tap(user, l);
    await user.click(t.row('uz'));
    t.rerender();
    for (const l of 'ism') await t.tap(user, l);
    await user.click(t.star());
    t.rerender();
    expect(screen.getByText('city')).toBeInTheDocument();
    expect(screen.queryByText('name')).toBeNull();
  });

  it('renders one slot per letter on each side and the whole bank', () => {
    setup();
    expect(within(screen.getByTestId('row-source')).getAllByTestId('slot')).toHaveLength(4);
    expect(within(screen.getByTestId('row-uz')).getAllByTestId('slot')).toHaveLength(3);
    expect(within(screen.getByTestId('bank')).getAllByRole('button')).toHaveLength(7);
  });

  it('shows the source side active at the start and switches when the active side fills', async () => {
    const t = setup({ pairs: [TWO] });
    const user = userEvent.setup();
    expect(t.row('source')).toHaveAttribute('data-active', '');
    expect(t.row('uz')).not.toHaveAttribute('data-active');
    for (const l of 'iki') await t.tap(user, l);
    expect(t.row('uz')).toHaveAttribute('data-active', '');
  });

  it('tapping a filled slot returns its tile to the bank and leaves the slot empty', async () => {
    const t = setup();
    const user = userEvent.setup();
    await t.tap(user, 'i');
    await t.tap(user, 's');
    expect(within(t.bank()).getAllByTestId('socket')).toHaveLength(2);
    const slots = within(t.row('source')).getAllByTestId('slot');
    await user.click(within(slots[0]!).getByRole('button'));
    t.rerender();
    expect(within(t.bank()).getAllByTestId('socket')).toHaveLength(1);
    expect(within(t.row('source')).getAllByTestId('slot')[0]).toHaveAttribute(
      'data-filled',
      'false',
    );
    expect(within(t.row('source')).getAllByTestId('slot')[1]).toHaveAttribute(
      'data-filled',
      'true',
    );
  });

  it('keeps Tekshir inert until every slot is full', async () => {
    const t = setup({ pairs: [TWO] });
    const user = userEvent.setup();
    expect(t.star()).toHaveAttribute('aria-disabled', 'true');
    await user.click(t.star());
    expect(t.dispatch).not.toHaveBeenCalledWith({ type: 'check' });
    for (const l of 'ikiikki') await t.tap(user, l);
    expect(t.star()).not.toHaveAttribute('aria-disabled');
  });

  it('a wrong check cracks only the wrong row, then recovers; letters stay', async () => {
    const t = setup({ pairs: [NAME] });
    const user = userEvent.setup();
    for (const l of 'isim') await t.tap(user, l);
    for (const l of 'smi') await t.tap(user, l);
    await user.click(t.star());
    t.rerender();
    expect(t.row('uz')).toHaveAttribute('data-result', 'wrong');
    expect(t.row('source')).toHaveAttribute('data-result', 'right');
    expect(
      within(t.row('uz'))
        .getAllByTestId('slot')
        .every((s) => s.dataset.filled === 'true'),
    ).toBe(true);
    act(() => t.clock.advance(WRONG_MS + 50));
    expect(t.row('uz')).not.toHaveAttribute('data-result');
    expect(t.session.getState().lives).toBe(2);
  });

  it('uses Tekshir in Latin and Текшир in Cyrillic', () => {
    setup();
    expect(screen.getByRole('button', { name: /Tekshir/ })).toBeInTheDocument();
    cleanup();
    setup({ script: 'cyrl' });
    expect(screen.getByRole('button', { name: /Текшир/ })).toBeInTheDocument();
  });

  it('shows the Uzbek tiles in the chosen script; digraphs are one tile', () => {
    setup({ pairs: [CITY], script: 'latn' });
    expect(within(screen.getByTestId('bank')).getAllByRole('button', { name: 'sh' })).toHaveLength(
      1,
    );
  });

  it('English appears only as the clue', () => {
    setup();
    expect(document.body.textContent).not.toMatch(/\b(city|two)\b/);
  });

  it('Oson tints tiles by origin with a non-colour cue; Orta and Qiyin do not', () => {
    const oson = setup({ mode: 'oson' });
    const tiles = within(oson.bank()).getAllByTestId('bank-cell');
    expect(tiles.some((c) => c.dataset.tint === 'source')).toBe(true);
    expect(tiles.some((c) => c.dataset.tint === 'uz')).toBe(true);
    expect(within(oson.bank()).getAllByTestId('origin-cue').length).toBe(7);
    oson.view.unmount();
    for (const mode of ['orta', 'qiyin'] as const) {
      const t = setup({ mode });
      expect(within(t.bank()).queryAllByTestId('origin-cue')).toHaveLength(0);
      expect(
        within(t.bank())
          .getAllByTestId('bank-cell')
          .every((c) => !c.dataset.tint),
      ).toBe(true);
      t.view.unmount();
    }
  });

  it('shows the mode name and a progress row of octagons', () => {
    setup({ mode: 'qiyin' });
    expect(screen.getByText('Qiyin')).toBeInTheDocument();
    const dots = screen.getAllByTestId('progress-dot');
    expect(dots).toHaveLength(2);
    expect(dots[0]).toHaveAttribute('data-state', 'current');
    expect(dots[1]).toHaveAttribute('data-state', 'todo');
  });

  it('marks completed pairs in the progress row', async () => {
    const t = setup({ pairs: [TWO, NAME] });
    const user = userEvent.setup();
    for (const l of 'ikiikki') await t.tap(user, l);
    await user.click(t.star());
    t.rerender();
    const dots = screen.getAllByTestId('progress-dot');
    expect(dots[0]).toHaveAttribute('data-state', 'done');
    expect(dots[1]).toHaveAttribute('data-state', 'current');
  });

  it('long-pressing an empty slot dispatches a hint and never a tap', () => {
    const t = setup();
    const slot = within(within(t.row('uz')).getAllByTestId('slot')[1]!).getByRole('button');
    fireEvent.pointerDown(slot, { clientX: 1, clientY: 1 });
    act(() => t.clock.advance(HINT_HOLD_MS + 20));
    expect(t.dispatch).toHaveBeenCalledWith({ type: 'hint', side: 'uz', slot: 1 });
    fireEvent.pointerUp(slot);
    fireEvent.click(slot);
    expect(t.dispatch).toHaveBeenCalledTimes(1);
    t.rerender();
    expect(within(t.row('uz')).getAllByTestId('slot')[1]).toHaveAttribute('data-locked', 'true');
  });

  it('H on a focused empty slot hints it', async () => {
    const t = setup();
    const user = userEvent.setup();
    within(within(t.row('source')).getAllByTestId('slot')[0]!)
      .getByRole('button')
      .focus();
    await user.keyboard('h');
    expect(t.dispatch).toHaveBeenCalledWith({ type: 'hint', side: 'source', slot: 0 });
  });

  it('keyboard: letters place, Backspace returns the last tile, Enter checks, arrows switch side', async () => {
    const t = setup({ pairs: [TWO, NAME] });
    const user = userEvent.setup();
    const root = screen.getByTestId('imlo-board');
    root.focus();
    const press = async (keys: string) => {
      for (const k of keys.match(/\{[^}]+\}|./g)!) {
        await user.keyboard(k);
        t.rerender();
      }
    };
    await press('ik');
    expect(within(t.bank()).getAllByTestId('socket')).toHaveLength(2);
    await press('{Backspace}');
    expect(within(t.bank()).getAllByTestId('socket')).toHaveLength(1);
    await press('{ArrowRight}');
    expect(t.row('uz')).toHaveAttribute('data-active', '');
    await press('{ArrowLeft}');
    expect(t.row('source')).toHaveAttribute('data-active', '');
    await press('kiikki{Enter}');
    expect(t.dispatch).toHaveBeenCalledWith({ type: 'check' });
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('ignores letters with no free tile', async () => {
    const t = setup({ pairs: [TWO] });
    const user = userEvent.setup();
    screen.getByTestId('imlo-board').focus();
    await user.keyboard('z');
    expect(t.dispatch).not.toHaveBeenCalled();
  });

  it('Persian source rows are RTL', () => {
    setup({ pairs: [pair('x', 'x', ['ا', 'ب'], [...'ab'], 'fa')] });
    expect(screen.getByTestId('row-source')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByTestId('row-uz')).toHaveAttribute('dir', 'ltr');
  });

  it('shows distractor tiles in the bank', () => {
    setup({ pairs: [pair('x', 'x', [...'isim'], [...'ism'], 'tr', ['k', 'z'])], mode: 'qiyin' });
    expect(within(screen.getByTestId('bank')).getAllByRole('button')).toHaveLength(9);
  });

  it('hides nothing but stays live while a wrong animation plays', async () => {
    const t = setup({ pairs: [NAME] });
    const user = userEvent.setup();
    for (const l of 'isim') await t.tap(user, l);
    for (const l of 'smi') await t.tap(user, l);
    await user.click(t.star());
    t.rerender();
    const slot = within(within(t.row('uz')).getAllByTestId('slot')[0]!).getByRole('button');
    await user.click(slot);
    expect(t.dispatch).toHaveBeenCalledWith({ type: 'remove', side: 'uz', slot: 0 });
  });
});
