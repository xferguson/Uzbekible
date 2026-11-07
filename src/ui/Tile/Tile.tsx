import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { type LongPressHandlers } from '../hooks';
import styles from './Tile.module.css';

export type TileState = 'idle' | 'selected' | 'matched' | 'wrong' | 'cracked' | 'disabled';
export type TileShape = 'rect' | 'hex';

export interface TileProps {
  /** Accessible name (the visible text unless `children` is given). */
  label: string;
  state?: TileState;
  shape?: TileShape;
  onSelect?: () => void;
  /** Extra key handling, e.g. a hint key. Enter/Space selection still works. */
  onKeyDown?: (e: KeyboardEvent) => void;
  /** e.g. `useLongPress(...)` for the English hint. */
  pressHandlers?: Partial<LongPressHandlers>;
  children?: ReactNode;
}

// Non-colour cue for every state: [glyph drawn on the tile, text for assistive tech].
const CUES: Record<Exclude<TileState, 'idle'>, [string, string]> = {
  selected: ['●', 'selected'],
  matched: ['★', 'matched'],
  wrong: ['✕', 'wrong'],
  cracked: ['⌁', 'cracked'],
  disabled: ['–', 'unavailable'],
};

/** The shared game tile: states, rect or hex shape, keyboard (Enter/Space), never colour-only. */
export function Tile({
  label,
  state = 'idle',
  shape = 'rect',
  onSelect,
  onKeyDown,
  pressHandlers,
  children,
}: TileProps) {
  const descId = useId();
  const inert = state === 'disabled' || state === 'matched';
  const cue = state === 'idle' ? undefined : CUES[state];
  return (
    <button
      type="button"
      className={styles.tile}
      data-state={state}
      data-shape={shape}
      aria-label={label}
      aria-pressed={state === 'selected'}
      aria-disabled={state === 'disabled' ? true : undefined}
      aria-describedby={cue ? descId : undefined}
      onClick={inert ? undefined : onSelect}
      onKeyDown={onKeyDown}
      {...pressHandlers}
    >
      {cue && (
        <span data-marker aria-hidden="true" className={styles.marker}>
          {cue[0]}
        </span>
      )}
      <span className={styles.face}>{children ?? label}</span>
      {cue && (
        <span id={descId} className={styles.sr}>
          {cue[1]}
        </span>
      )}
    </button>
  );
}
