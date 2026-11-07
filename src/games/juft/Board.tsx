/**
 * Juft board: two columns (source left, Uzbek right) drawn from the rules state. Rules own the truth; this view
 * adds only short-lived animation state (match settling, wrong flash, hint gloss) driven by the rules events.
 * Timings come from the D2 motion table. No English is rendered except the gloss during a hint.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { frameLoop, systemClock, type FrameClock } from '@core/clock';
import type { GameEvent } from '@core/session';
import type { SourceLang } from '@core/text';
import { Tile, SourceText, UzText, useLongPress, type TileState } from '@ui/index';
import { label } from '../../ui/labels.ts';
import type { BoardProps } from '../types.ts';
import type { JuftPair, JuftParams } from './levels.ts';
import type { JuftAction, JuftEvent, JuftState, Side } from './rules.ts';
import styles from './Board.module.css';

/** Hold time before the hint fires (D2 decision 8). */
export const HINT_HOLD_MS = 450;
/** How long the English gloss stays visible. */
export const HINT_SHOW_MS = 1500;
/** Matched tiles bloom and dissolve, then leave a socket (D2 timing table). */
export const MATCH_SETTLE_MS = 650;
/** Wrong pair: crack + shake, then everything clears. */
export const WRONG_MS = 500;

const MIN_TILE = 44;
const MAX_TILE = 96;
const DENSE_FROM = 10;

export interface BoardMetrics {
  gap: number;
  fontSize: number;
  dense: boolean;
  minTile: number;
  maxTile: number;
}

/** Spacing and type size by pair count. Tile height itself comes from CSS (available height). */
export function boardMetrics(pairs: number): BoardMetrics {
  const dense = pairs >= DENSE_FROM;
  return {
    gap: dense ? 6 : 10,
    fontSize: dense ? 17 : 20,
    dense,
    minTile: MIN_TILE,
    maxTile: MAX_TILE,
  };
}

const BADGES: Record<SourceLang, string> = { tr: 'TR', ru: 'РУ', fa: 'فا', ar: 'عر' };

export interface JuftBoardProps extends BoardProps<
  JuftParams,
  JuftState,
  JuftAction,
  JuftEvent | GameEvent
> {
  /** Injected for tests; defaults to the system clock. */
  clock?: FrameClock;
}

type Wrong = { leftId: string; rightId: string };
type Hint = { side: Side; tileId: string };

export function Board({
  spec,
  settings,
  state,
  dispatch,
  subscribe,
  clock = systemClock,
}: JuftBoardProps) {
  const { pairs, hard } = spec.params;
  const game = state.game;
  const script = settings.script;
  const byId = new Map(pairs.map((p) => [p.id, p]));
  const metrics = boardMetrics(pairs.length);
  const mixed = settings.sourceLangs.length > 1;

  const [settling, setSettling] = useState<ReadonlySet<string>>(new Set());
  const [wrong, setWrong] = useState<Wrong | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);

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
        const ev = e as { type: string } & Partial<Wrong> & { tileId?: string };
        if (ev.type === 'matched' && ev.tileId !== undefined) {
          const id = ev.tileId;
          setSettling((s) => new Set(s).add(id));
          after(MATCH_SETTLE_MS, () =>
            setSettling((s) => {
              const next = new Set(s);
              next.delete(id);
              return next;
            }),
          );
        } else if (
          ev.type === 'mismatched' &&
          ev.leftId !== undefined &&
          ev.rightId !== undefined
        ) {
          const w = { leftId: ev.leftId, rightId: ev.rightId };
          setWrong(w);
          after(WRONG_MS, () => setWrong((cur) => (cur === w ? null : cur)));
        }
      }),
    [subscribe, after],
  );

  const showHint = useCallback(
    (side: Side, tileId: string) => {
      dispatch({ type: 'hint', tileId });
      const h = { side, tileId };
      setHint(h);
      after(HINT_SHOW_MS, () => setHint((cur) => (cur === h ? null : cur)));
    },
    [dispatch, after],
  );

  const column = (side: Side) => {
    const ids = side === 'left' ? game.left : game.right;
    return (
      <div
        data-testid={`col-${side}`}
        className={styles.column}
        data-fresh={hard ? '' : undefined}
        style={
          {
            '--n': String(pairs.length),
            '--gap': `${metrics.gap}px`,
            '--fs': `${metrics.fontSize}px`,
            '--min-tile': `${metrics.minTile}px`,
            '--max-tile': `${metrics.maxTile}px`,
          } as React.CSSProperties
        }
      >
        {ids.map((id) => {
          const pair = byId.get(id)!;
          const matched = game.matched.includes(id);
          if (matched && !settling.has(id)) {
            return (
              <div key={id} data-testid="socket" aria-hidden="true" className={styles.socket} />
            );
          }
          let tileState: TileState = 'idle';
          if (matched) tileState = 'matched';
          else if (wrong && (side === 'left' ? wrong.leftId : wrong.rightId) === id)
            tileState = 'wrong';
          else if (game.selected?.side === side && game.selected.tileId === id)
            tileState = 'selected';
          return (
            <Cell
              key={id}
              side={side}
              pair={pair}
              state={tileState}
              script={script}
              badge={side === 'left' && mixed}
              glossShown={hint?.side === side && hint.tileId === id}
              clock={clock}
              onSelect={() => dispatch({ type: 'select', side, tileId: id })}
              onHint={() => showHint(side, id)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.board} data-dense={metrics.dense ? '' : undefined}>
      {hard && <p className={styles.fresh}>{label(script, 'Yangi naqsh')}</p>}
      <div className={styles.columns}>
        {column('left')}
        {column('right')}
      </div>
    </div>
  );
}

interface CellProps {
  side: Side;
  pair: JuftPair;
  state: TileState;
  script: 'latn' | 'cyrl';
  badge: boolean;
  glossShown: boolean;
  clock: FrameClock;
  onSelect: () => void;
  onHint: () => void;
}

function Cell({
  side,
  pair,
  state,
  script,
  badge,
  glossShown,
  clock,
  onSelect,
  onHint,
}: CellProps) {
  const held = useRef(false);
  const press = useLongPress(
    () => {
      held.current = true;
      onHint();
    },
    { ms: HINT_HOLD_MS, clock },
  );
  const text = side === 'left' ? pair.source.text : script === 'cyrl' ? pair.uz.cyrl : pair.uz.latn;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'h' || e.key === 'H') onHint();
  };
  return (
    <div className={styles.cell} data-tile-id={pair.id}>
      <Tile
        label={text}
        state={state}
        onKeyDown={onKeyDown}
        onSelect={() => {
          // A hold is a hint, never a selection.
          if (held.current) {
            held.current = false;
            return;
          }
          onSelect();
        }}
        pressHandlers={{
          ...press,
          onPointerDown: (e) => {
            held.current = false;
            press.onPointerDown(e);
          },
        }}
      >
        {badge && side === 'left' && (
          <span data-testid="lang-badge" lang={pair.source.lang} className={styles.badge}>
            {BADGES[pair.source.lang]}
          </span>
        )}
        {side === 'left' ? (
          <SourceText lang={pair.source.lang} text={pair.source.text} className={styles.word} />
        ) : (
          <UzText
            latn={pair.uz.latn}
            cyrl={pair.uz.cyrl}
            script={script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'}
            className={styles.word}
          />
        )}
      </Tile>
      {glossShown && (
        <span role="status" className={styles.gloss}>
          {pair.glossEn}
        </span>
      )}
    </div>
  );
}
