/**
 * Imlo board: two rows of letter slots (source, Uzbek), the check star with the English clue, and the shared
 * letter bank. Rules own the truth (`rules.ts`); this view adds only short-lived animation state driven by the
 * rules events. The clue is the one English text allowed on a board (docs/games/06-imlo.md).
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { frameLoop, systemClock, type FrameClock } from '@core/clock';
import type { GameEvent } from '@core/session';
import type { SourceLang } from '@core/text';
import { SourceText, Tile, UzText, useLongPress } from '@ui/index';
import { label } from '../../ui/labels.ts';
import type { BoardProps } from '../types.ts';
import type { BankTile, ImloMode, ImloPair, ImloParams } from './levels.ts';
import type { ImloAction, ImloEvent, ImloState, Side } from './rules.ts';
import styles from './Board.module.css';

/** Hold time before the hint fires (I4 decision 9). */
export const HINT_HOLD_MS = 450;
/** Wrong check: crack and shake, then the row is plain again. */
export const WRONG_MS = 500;
/** Correct check: the star shows its tick while the next pair slides in. */
export const RIGHT_MS = 650;

const BADGES: Record<SourceLang, string> = { tr: 'TR', ru: 'РУ', fa: 'فا', ar: 'عر' };
const MODE_NAMES: Record<ImloMode, string> = { oson: 'Oson', orta: 'Oʻrta', qiyin: 'Qiyin' };
const ARABIC = /\p{Script=Arabic}/u;

/** Slot width in px by word length (I4 decision 8): phone and desktop. */
export function slotSize(letters: number): { phone: number; desktop: number } {
  if (letters <= 5) return { phone: 52, desktop: 64 };
  if (letters === 6) return { phone: 50, desktop: 60 };
  if (letters === 7) return { phone: 47, desktop: 60 };
  return { phone: 44, desktop: 56 };
}

export interface ImloBoardProps extends BoardProps<
  ImloParams,
  ImloState,
  ImloAction,
  ImloEvent | GameEvent
> {
  /** Injected for tests; defaults to the system clock. */
  clock?: FrameClock;
}

type Result = Partial<Record<Side, 'right' | 'wrong'>>;

const sameLetter = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function Board({
  spec,
  settings,
  state,
  dispatch,
  subscribe,
  clock = systemClock,
}: ImloBoardProps) {
  const { pairs, mode } = spec.params;
  const game = state.game;
  const script = settings.script;
  const pair = pairs[game.pair];
  const previous = useRef(game.pair);
  const [result, setResult] = useState<Result | null>(null);
  const [solved, setSolved] = useState(false);
  const stops = useRef(new Set<() => void>());

  const after = useCallback(
    (ms: number, fn: () => void) => {
      const start = clock.now();
      const stop = frameLoop(clock, (_dt, now) => {
        if (now - start < ms) return;
        stop();
        stops.current.delete(stop);
        fn();
      });
      stops.current.add(stop);
    },
    [clock],
  );
  useEffect(() => {
    const live = stops.current;
    return () => {
      for (const stop of live) stop();
      live.clear();
    };
  }, []);

  useEffect(
    () =>
      subscribe((e) => {
        const ev = e as { type: string; side?: Side };
        if (ev.type === 'spellWrong' && ev.side) {
          const wrongSide = ev.side;
          setResult((cur) => {
            const next: Result = {
              source: cur?.source ?? 'right',
              uz: cur?.uz ?? 'right',
              [wrongSide]: 'wrong',
            };
            return next;
          });
          after(WRONG_MS, () => setResult(null));
        } else if (ev.type === 'spellCorrect') {
          setSolved(true);
          after(RIGHT_MS, () => setSolved(false));
        }
      }),
    [subscribe, after],
  );

  // A new pair clears any leftover wrong state.
  useEffect(() => {
    if (previous.current !== game.pair) {
      previous.current = game.pair;
      setResult(null);
    }
  }, [game.pair]);

  if (!pair) return <div data-testid="imlo-board" className={styles.board} />;

  const inSlot = new Set([...game.slots.source, ...game.slots.uz]);
  const full = (['source', 'uz'] as Side[]).every((s) => game.slots[s].every((x) => x !== null));
  const bankIds = game.banks[game.pair] ?? pair.bank.map((t) => t.id);
  const byId = new Map(pair.bank.map((t) => [t.id, t]));
  const letterOf = (id: string | null) => (id === null ? undefined : byId.get(id)?.letter);

  const check = () => {
    if (full) dispatch({ type: 'check' });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key;
    if (key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      check();
    } else if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown'
    ) {
      e.preventDefault();
      dispatch({ type: 'selectSide', side: game.active === 'source' ? 'uz' : 'source' });
    } else if (key === 'Backspace') {
      e.preventDefault();
      const order: Side[] = [game.active, game.active === 'source' ? 'uz' : 'source'];
      for (const side of order) {
        for (let i = game.slots[side].length - 1; i >= 0; i--) {
          if (game.slots[side][i] !== null && !game.locked[side][i]) {
            dispatch({ type: 'remove', side, slot: i });
            return;
          }
        }
      }
    } else if (key.length === 1 && /\S/u.test(key) && e.target === e.currentTarget) {
      const tile = bankIds
        .map((id) => byId.get(id))
        .find((t): t is BankTile => !!t && !inSlot.has(t.id) && sameLetter(t.letter, key));
      if (tile) dispatch({ type: 'place', tileId: tile.id });
    }
  };

  const tint = (t: BankTile) =>
    mode === 'oson' && t.origin !== 'distractor' ? t.origin : undefined;

  return (
    // The board is a keyboard scope (letters, Backspace, Enter, arrows) around real buttons.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      data-testid="imlo-board"
      className={styles.board}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-mode={mode}
    >
      <div className={styles.progress}>
        <ol className={styles.dots} aria-label={label(script, 'Juftlar')}>
          {pairs.map((p, i) => (
            <li
              key={p.itemId}
              data-testid="progress-dot"
              data-state={i < game.pair ? 'done' : i === game.pair ? 'current' : 'todo'}
              className={styles.dot}
            />
          ))}
        </ol>
        <span className={styles.mode}>{label(script, MODE_NAMES[mode])}</span>
      </div>

      <div className={styles.stage} key={game.pair}>
        <SlotRow
          side="source"
          pair={pair}
          state={game}
          script={script}
          result={result?.source}
          badge={BADGES[pair.source.lang]}
          dispatch={dispatch}
          clock={clock}
          letterOf={letterOf}
          byId={byId}
          mode={mode}
        />
        <div className={styles.center}>
          <button
            type="button"
            className={styles.star}
            data-ready={full ? '' : undefined}
            data-solved={solved ? '' : undefined}
            aria-disabled={full ? undefined : true}
            onClick={check}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" className={styles.starShape}>
              <polygon points="50,2 61,21 85,15 80,39 98,50 80,61 85,85 61,80 50,98 39,80 15,85 20,61 2,50 20,39 15,15 39,21" />
            </svg>
            <span className={styles.starLabel}>{label(script, 'Tekshir')}</span>
            {solved && <span aria-hidden="true">✓</span>}
          </button>
          <p className={styles.clue}>
            <span>{pair.clue}</span>
          </p>
        </div>
        <SlotRow
          side="uz"
          pair={pair}
          state={game}
          script={script}
          result={result?.uz}
          badge="UZ"
          dispatch={dispatch}
          clock={clock}
          letterOf={letterOf}
          byId={byId}
          mode={mode}
        />
      </div>

      <div className={styles.bank} data-testid="bank">
        {bankIds.map((id) => {
          const t = byId.get(id);
          if (!t) return null;
          if (inSlot.has(id))
            return (
              <div key={id} data-testid="socket" aria-hidden="true" className={styles.socket} />
            );
          const tinted = tint(t);
          return (
            <div key={id} data-testid="bank-cell" className={styles.bankCell} data-tint={tinted}>
              <Tile label={t.letter} onSelect={() => dispatch({ type: 'place', tileId: id })}>
                {tinted && (
                  <span data-testid="origin-cue" aria-hidden="true" className={styles.cue}>
                    {tinted === 'source' ? '◆' : '●'}
                  </span>
                )}
                <Letter tile={t} pair={pair} script={script} />
              </Tile>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Letter({
  tile,
  pair,
  script,
}: {
  tile: BankTile;
  pair: ImloPair;
  script: 'latn' | 'cyrl';
}) {
  const uz = tile.origin === 'uz' || (tile.origin === 'distractor' && !ARABIC.test(tile.letter));
  return uz ? (
    <UzText
      latn={tile.letter}
      cyrl={tile.letter}
      script={script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'}
      className={styles.letter}
    />
  ) : (
    <SourceText lang={pair.source.lang} text={tile.letter} className={styles.letter} />
  );
}

interface SlotRowProps {
  side: Side;
  pair: ImloPair;
  state: ImloState;
  script: 'latn' | 'cyrl';
  result: 'right' | 'wrong' | undefined;
  badge: string;
  dispatch: (a: ImloAction) => void;
  clock: FrameClock;
  letterOf: (id: string | null) => string | undefined;
  byId: Map<string, BankTile>;
  mode: ImloMode;
}

function SlotRow({
  side,
  pair,
  state,
  script,
  result,
  badge,
  dispatch,
  clock,
  letterOf,
  byId,
  mode,
}: SlotRowProps) {
  const word = pair[side].letters;
  const rtl = side === 'source' && (pair.source.lang === 'fa' || pair.source.lang === 'ar');
  const size = slotSize(word.length);
  const nextEmpty = state.slots[side].indexOf(null);
  const active = state.active === side;
  return (
    // Tapping the row's padding picks the side; the slots inside are the real, focusable controls.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      data-testid={`row-${side}`}
      role="group"
      aria-label={side === 'source' ? badge : label(script, 'Oʻzbekcha')}
      className={styles.row}
      dir={rtl ? 'rtl' : 'ltr'}
      data-active={active ? '' : undefined}
      data-result={result}
      style={
        {
          '--slot-phone': `${size.phone}px`,
          '--slot-desk': `${size.desktop}px`,
        } as React.CSSProperties
      }
      onClick={() => dispatch({ type: 'selectSide', side })}
      onFocus={() => {
        if (!active) dispatch({ type: 'selectSide', side });
      }}
    >
      <span className={styles.badge} lang={side === 'source' ? pair.source.lang : undefined}>
        {badge}
      </span>
      {state.slots[side].map((id, i) => (
        <Slot
          key={i}
          side={side}
          index={i}
          tile={id === null ? undefined : byId.get(id)}
          letter={letterOf(id)}
          locked={state.locked[side][i] ?? false}
          next={active && i === nextEmpty}
          pair={pair}
          script={script}
          dispatch={dispatch}
          clock={clock}
          wrong={result === 'wrong'}
          mode={mode}
        />
      ))}
    </div>
  );
}

interface SlotProps {
  side: Side;
  index: number;
  tile: BankTile | undefined;
  letter: string | undefined;
  locked: boolean;
  next: boolean;
  pair: ImloPair;
  script: 'latn' | 'cyrl';
  dispatch: (a: ImloAction) => void;
  clock: FrameClock;
  wrong: boolean;
  mode: ImloMode;
}

function Slot({
  side,
  index,
  tile,
  letter,
  locked,
  next,
  pair,
  script,
  dispatch,
  clock,
  wrong,
  mode,
}: SlotProps) {
  const held = useRef(false);
  const hint = () => dispatch({ type: 'hint', side, slot: index });
  const press = useLongPress(
    () => {
      held.current = true;
      hint();
    },
    { ms: HINT_HOLD_MS, clock },
  );
  const handlers = {
    ...press,
    onPointerDown: (e: React.PointerEvent) => {
      held.current = false;
      press.onPointerDown(e as never);
    },
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'h' || e.key === 'H') {
      e.stopPropagation();
      hint();
    }
  };
  const filled = tile !== undefined && letter !== undefined;
  const onSelect = () => {
    if (filled && !locked) dispatch({ type: 'remove', side, slot: index });
  };
  return (
    <div
      data-testid="slot"
      className={styles.slot}
      data-filled={filled ? 'true' : 'false'}
      data-locked={locked ? 'true' : 'false'}
      data-next={next ? '' : undefined}
      data-tint={tile && mode === 'oson' && tile.origin !== 'distractor' ? tile.origin : undefined}
      onClickCapture={(e) => {
        // A hold is a hint, never a tap: swallow the click that follows it.
        if (held.current) {
          held.current = false;
          e.stopPropagation();
        }
      }}
    >
      {filled ? (
        <Tile
          label={letter}
          state={wrong ? 'wrong' : 'idle'}
          onSelect={onSelect}
          onKeyDown={onKeyDown}
          pressHandlers={handlers}
        >
          <Letter tile={tile} pair={pair} script={script} />
          {locked && (
            <span aria-hidden="true" className={styles.lock}>
              🔒
            </span>
          )}
        </Tile>
      ) : (
        <button
          type="button"
          className={styles.empty}
          aria-label={`${index + 1}`}
          onClick={onSelect}
          onKeyDown={onKeyDown}
          {...handlers}
        >
          {next && (
            <span aria-hidden="true" className={styles.nextStar}>
              ✸
            </span>
          )}
        </button>
      )}
    </div>
  );
}
