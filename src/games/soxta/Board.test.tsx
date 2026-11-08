import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createFakeClock, type FakeClock } from '@core/clock';
import { createRng } from '@core/random';
import { createSession, type GameEvent, type Session, type SessionState } from '@core/session';
import { makeItem } from '@core/content/fixtures.ts';
import type { LevelSpec } from '../types.ts';
import { Board, REVEAL_MS, CORRECT_MS } from './Board.tsx';
import type { Card } from './cards.ts';
import {
  correctSide,
  createSoxtaRules,
  type Side,
  type SoxtaAction,
  type SoxtaEvent,
  type SoxtaState,
} from './rules.ts';

const card = (id: string, latn: string, cyrl: string, tr: string, withOther = true): Card => ({
  id,
  uz: makeItem({ id, uz: { latn, cyrl } }),
  other: { lang: 'tr', text: tr },
  clues: withOther
    ? { uz: `${id}-uz-meaning`, other: `${id}-tr-meaning` }
    : { uz: `${id}-uz-meaning` },
  tier: 1,
});

const CARDS = [
  card('a', 'yalqov', 'ялқов', 'yalkın'),
  card('b', 'qoʻl', 'қўл', 'kol'),
  card('c', 'yaxshi', 'яхши', 'yakışıklı'),
];

type Sess = Session<SoxtaState, SoxtaAction, SoxtaEvent | GameEvent>;

function setup(opts: { script?: 'latn' | 'cyrl'; cards?: Card[]; reduced?: boolean } = {}) {
  const clock: FakeClock = createFakeClock();
  const rules = createSoxtaRules({ cards: opts.cards ?? CARDS, rng: createRng(3) });
  const session = createSession({ rules, lives: 3, countdownMs: 0, clock }) as Sess;
  session.start();
  const spec: LevelSpec<unknown> = { level: 1, seed: 's', lives: 3, params: {} };
  const settings = { sourceLangs: ['tr'], script: opts.script ?? 'latn' } as const;
  const dispatch = vi.fn((a: SoxtaAction) => session.dispatch(a));
  function Live() {
    return (
      <Board
        spec={spec}
        settings={settings}
        state={session.getState() as SessionState<SoxtaState>}
        dispatch={dispatch}
        subscribe={session.subscribe as never}
        clock={clock}
        reducedMotion={opts.reduced ?? false}
      />
    );
  }
  const view = render(<Live />);
  const rerender = () => view.rerender(<Live />);
  const cur = () => session.getState().game.current;
  const answer = (side: Side) => {
    fireEvent.click(screen.getByTestId(`tile-${side}`));
    rerender();
  };
  const advance = (ms: number) => {
    act(() => clock.advance(ms));
    rerender();
  };
  return { clock, session, dispatch, rerender, cur, answer, advance };
}

const opposite = (s: Side): Side => (s === 'left' ? 'right' : 'left');

describe('Soxta Board', () => {
  it('shows the Uzbek word and the Turkish word on opposite sides with the English clue between', () => {
    const t = setup();
    const { card: c, uzSide, clue } = t.cur();
    const uzTile = screen.getByTestId(`tile-${uzSide}`);
    const trTile = screen.getByTestId(`tile-${opposite(uzSide)}`);
    expect(within(uzTile).getByText(c.uz.uz.latn)).toBeInTheDocument();
    expect(within(trTile).getByText(c.other.text)).toBeInTheDocument();
    expect(within(uzTile).getByText('UZ')).toBeInTheDocument();
    expect(within(trTile).getByText('TR')).toBeInTheDocument();
    expect(screen.getByTestId('clue')).toHaveTextContent(clue.text);
  });

  it('shows the Uzbek word in Cyrillic when the setting says so; Turkish stays Turkish', () => {
    const t = setup({ script: 'cyrl' });
    const { card: c, uzSide } = t.cur();
    expect(
      within(screen.getByTestId(`tile-${uzSide}`)).getByText(c.uz.uz.cyrl),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId(`tile-${opposite(uzSide)}`)).getByText(c.other.text),
    ).toBeInTheDocument();
  });

  it('swiping toward the clued word is correct: next card, streak and score rise', () => {
    const t = setup();
    const before = t.cur();
    const right = correctSide(before);
    const card0 = screen.getByTestId('card');
    card0.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;
    const x = right === 'right' ? 160 : -160;
    fireEvent.pointerDown(card0, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(card0, { clientX: 100 + x, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(card0, { clientX: 100 + x, clientY: 100, pointerId: 1 });
    t.rerender();
    const game = t.session.getState().game;
    expect(game.correct).toBe(1);
    expect(game.streak).toBe(1);
    expect(game.current.card.id).not.toBe(before.card.id);
    expect(t.session.getState().lives).toBe(3);
  });

  it('arrow keys and tapping a side answer too', () => {
    const t = setup();
    const right = correctSide(t.cur());
    fireEvent.keyDown(screen.getByTestId('card'), {
      key: right === 'left' ? 'ArrowLeft' : 'ArrowRight',
    });
    t.rerender();
    expect(t.session.getState().game.correct).toBe(1);
    t.advance(CORRECT_MS);
    t.answer(correctSide(t.cur()));
    expect(t.session.getState().game.correct).toBe(2);
  });

  it('arrow buttons answer', () => {
    const t = setup();
    const side = correctSide(t.cur());
    fireEvent.click(screen.getByRole('button', { name: side === 'left' ? 'Chap' : 'Oʻng' }));
    t.rerender();
    expect(t.session.getState().game.correct).toBe(1);
  });

  it('a wrong answer loses a life and reveals both meanings, clue owner first, then clears', () => {
    const t = setup();
    const before = t.cur();
    t.answer(opposite(correctSide(before)));
    expect(t.session.getState().lives).toBe(2);
    const reveal = screen.getByTestId('reveal');
    expect(reveal).toHaveTextContent(`${before.card.id}-uz-meaning`);
    expect(reveal).toHaveTextContent(`${before.card.id}-tr-meaning`);
    const text = reveal.textContent!;
    const ownerFirst =
      before.clue.kind === 'uz'
        ? text.indexOf('uz-meaning') < text.indexOf('tr-meaning')
        : text.indexOf('tr-meaning') < text.indexOf('uz-meaning');
    expect(ownerFirst).toBe(true);
    t.advance(REVEAL_MS);
    expect(screen.queryByTestId('reveal')).toBeNull();
  });

  it('input is ignored during the reveal; tap on the reveal skips it', () => {
    const t = setup();
    t.answer(opposite(correctSide(t.cur())));
    t.dispatch.mockClear();
    t.answer('left');
    expect(t.dispatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('reveal'));
    expect(screen.queryByTestId('reveal')).toBeNull();
  });

  it('Space skips the reveal', () => {
    const t = setup();
    t.answer(opposite(correctSide(t.cur())));
    fireEvent.keyDown(screen.getByTestId('card'), { key: ' ' });
    expect(screen.queryByTestId('reveal')).toBeNull();
  });

  it('the per-card timer counts down and a timeout costs a life with the reveal', () => {
    const t = setup();
    const total = t.cur().remainingMs;
    t.advance(1000);
    expect(t.cur().remainingMs).toBeLessThanOrEqual(total - 900);
    expect(screen.getByTestId('timer').getAttribute('data-segments')).toBeDefined();
    t.advance(total);
    expect(t.session.getState().lives).toBe(2);
    expect(screen.getByTestId('reveal')).toBeInTheDocument();
  });

  it('the timer does not run during the reveal', () => {
    const t = setup();
    t.answer(opposite(correctSide(t.cur())));
    const ms = t.cur().remainingMs;
    t.advance(500);
    expect(t.cur().remainingMs).toBe(ms);
  });

  it('shows lives in the shared HUD', () => {
    const t = setup();
    expect(screen.getByRole('img', { name: /3/ })).toBeDefined();
    t.answer(opposite(correctSide(t.cur())));
    expect(screen.getByRole('img', { name: /2/ })).toBeDefined();
  });

  it('English appears only as the clue and in the reveal', () => {
    const t = setup();
    const board = screen.getByTestId('soxta-board');
    const clue = screen.getByTestId('clue').textContent!;
    expect(board.textContent).toContain(clue);
    expect(board.textContent).not.toMatch(/-tr-meaning/);
    t.answer(opposite(correctSide(t.cur())));
    expect(screen.getByTestId('reveal').textContent).toMatch(/-tr-meaning/);
  });

  it('does not offset the card during a drag under reduced motion', () => {
    setup({ reduced: true });
    const el = screen.getByTestId('card');
    el.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;
    fireEvent.pointerDown(el, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 140, clientY: 100, pointerId: 1 });
    expect(el.style.transform).toBe('');
  });

  it('a card without a Turkish meaning still reveals the Uzbek meaning', () => {
    const t = setup({ cards: [card('z', 'olma', 'олма', 'elma', false)] });
    t.answer(opposite(correctSide(t.cur())));
    expect(screen.getByTestId('reveal')).toHaveTextContent('z-uz-meaning');
  });
});
