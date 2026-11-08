/**
 * Soxta board: one card at a time, drawn from the rules state. Two word tiles on opposite sides, the English
 * clue between them, a per-card timer, and a reveal after every answer. Rules own the truth; this view adds
 * only the short feedback phase (the answered card is held while the rules have already drawn the next one).
 * English appears only as the clue and in the reveal.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { frameLoop, systemClock, type FrameClock } from '@core/clock';
import type { GameEvent } from '@core/session';
import {
  Combo,
  Lives,
  PatternBg,
  Score,
  SourceText,
  Tile,
  UzText,
  useSwipe,
  type TileState,
} from '@ui/index';
import { label } from '../../ui/labels.ts';
import type { BoardProps } from '../types.ts';
import {
  cardMsFor,
  correctSide,
  type Side,
  type SoxtaAction,
  type SoxtaCurrent,
  type SoxtaEvent,
  type SoxtaState,
} from './rules.ts';
import styles from './Board.module.css';

/** A correct answer glazes the tile for a moment before the next card (mockup J4). */
export const CORRECT_MS = 350;
/** A wrong answer or timeout holds the reveal this long; tap or Space skips (mockup J4). */
export const REVEAL_MS = 1400;
/** Timer segments (mockup J4); the last `WARN_SEGMENTS` turn ochre with a "!". */
export const SEGMENTS = 12;
export const WARN_SEGMENTS = 3;

export interface SoxtaBoardProps extends BoardProps<
  unknown,
  SoxtaState,
  SoxtaAction,
  SoxtaEvent | GameEvent
> {
  /** Injected for tests; defaults to the system clock. */
  clock?: FrameClock;
  /** Forces reduced motion; defaults to the media query. */
  reducedMotion?: boolean;
}

type Feedback = {
  kind: 'correct' | 'wrong' | 'timeout';
  picked?: Side;
  card: SoxtaCurrent;
};

const opposite = (s: Side): Side => (s === 'left' ? 'right' : 'left');

/** Filled segments for the time left; always at least one while time remains. */
export const segmentsLeft = (remainingMs: number, totalMs: number): number =>
  remainingMs <= 0 ? 0 : Math.min(SEGMENTS, Math.ceil((remainingMs / totalMs) * SEGMENTS));

export function Board({
  spec,
  settings,
  state,
  dispatch,
  subscribe,
  clock = systemClock,
  reducedMotion,
}: SoxtaBoardProps) {
  const game = state.game;
  const script = settings.script;
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // The card on screen when an event arrives is the one the event is about.
  const shown = useRef(game.current);
  useEffect(() => {
    shown.current = game.current;
  });

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
        const kind =
          ev.type === 'swipeCorrect'
            ? 'correct'
            : ev.type === 'swipeWrong'
              ? 'wrong'
              : ev.type === 'timeout'
                ? 'timeout'
                : undefined;
        if (!kind) return;
        const fb: Feedback = { kind, card: shown.current, ...(ev.side && { picked: ev.side }) };
        setFeedback(fb);
        after(kind === 'correct' ? CORRECT_MS : REVEAL_MS, () =>
          setFeedback((cur) => (cur === fb ? null : cur)),
        );
      }),
    [subscribe, after],
  );

  // The per-card countdown: ticks only while a card is live and no feedback is held.
  const running = state.phase === 'playing' && feedback === null && !game.over;
  useEffect(() => {
    if (!running) return;
    return frameLoop(clock, (dt) => dispatch({ type: 'tick', ms: dt }));
  }, [running, clock, dispatch]);

  const answer = (side: Side) => {
    if (feedback || state.phase !== 'playing' || game.over) return;
    dispatch({ type: 'swipe', side });
  };
  const skip = () => setFeedback(null);

  const swipe = useSwipe(answer, {
    clock,
    ...(reducedMotion !== undefined && { reducedMotion }),
  });
  const { onKeyDown: swipeKeys, ...bindRest } = swipe.bind;
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (feedback && feedback.kind !== 'correct' && e.key === ' ') {
      e.preventDefault();
      skip();
      return;
    }
    swipeKeys(e);
  };

  // While feedback is held the answered card stays on screen.
  const view = feedback ? feedback.card : game.current;
  const total = cardMsFor(game.streak);
  const timed = feedback ? feedback.card.remainingMs : game.current.remainingMs;
  const left = feedback?.kind === 'timeout' ? 0 : segmentsLeft(timed, total);
  const warn = left > 0 && left <= WARN_SEGMENTS;
  const answerSide = correctSide(view);

  const tileState = (side: Side): TileState => {
    if (!feedback) return 'idle';
    if (feedback.kind === 'correct') return side === feedback.picked ? 'matched' : 'idle';
    if (side === feedback.picked) return 'wrong';
    return 'idle';
  };

  const word = (side: Side) => {
    const isUz = side === view.uzSide;
    const text = isUz
      ? script === 'cyrl'
        ? view.card.uz.uz.cyrl
        : view.card.uz.uz.latn
      : view.card.other.text;
    return (
      <div
        className={styles.cell}
        data-side={side}
        data-answer={
          feedback && feedback.kind !== 'correct' && side === answerSide ? '' : undefined
        }
      >
        {feedback?.kind === 'wrong' && feedback.picked === side && (
          <svg
            data-testid="cracks"
            className={styles.cracks}
            viewBox="0 0 100 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M52 0 L46 40 L60 62 L48 100 L56 160 M46 40 L30 55 M60 62 L80 48 M48 100 L34 120" />
          </svg>
        )}
        <Tile label={text} state={tileState(side)} onSelect={() => answer(side)}>
          <span data-testid={`tile-${side}`} className={styles.tileFace}>
            <span className={styles.tag}>{isUz ? 'UZ' : 'TR'}</span>
            {isUz ? (
              <UzText
                latn={view.card.uz.uz.latn}
                cyrl={view.card.uz.uz.cyrl}
                script={script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'}
                className={styles.word}
              />
            ) : (
              <SourceText
                lang={view.card.other.lang}
                text={view.card.other.text}
                className={styles.word}
              />
            )}
          </span>
        </Tile>
      </div>
    );
  };

  const reveal = feedback && feedback.kind !== 'correct' ? feedback : null;
  const uzMeaning = view.card.clues.uz;
  const otherMeaning = view.card.clues.other;
  const rows = [
    { key: 'uz', side: view.uzSide, meaning: uzMeaning },
    { key: 'other', side: opposite(view.uzSide), meaning: otherMeaning },
  ];
  const ordered = view.clue.kind === 'uz' ? rows : [rows[1]!, rows[0]!];

  return (
    <div
      className={styles.board}
      data-testid="soxta-board"
      data-feedback={feedback?.kind}
      data-reduced={reducedMotion ? '' : undefined}
    >
      <PatternBg className={styles.pattern} />
      <div className={styles.hud}>
        <Lives lives={state.lives} max={spec.lives} script={script} />
        <Combo count={game.streak} script={script} />
        <Score value={game.score} script={script} />
      </div>

      <div
        data-testid="timer"
        data-segments={left}
        data-warn={warn ? '' : undefined}
        data-timeout={feedback?.kind === 'timeout' ? '' : undefined}
        role="timer"
        aria-label={label(script, 'Vaqt')}
        className={styles.timer}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span key={i} className={styles.segment} data-on={i < left ? '' : undefined} />
        ))}
        <span className={styles.seconds}>
          {warn && '! '}
          {feedback?.kind === 'timeout' ? '0' : Math.ceil(timed / 1000)}
        </span>
      </div>

      {/* The swipe surface: pointer gestures and arrow keys; the arrow buttons below are the accessible path. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        data-testid="card"
        className={styles.card}
        style={
          swipe.offsetX
            ? { transform: `translateX(${swipe.offsetX}px) rotate(${swipe.offsetX / 20}deg)` }
            : undefined
        }
        {...bindRest}
        onKeyDown={onKeyDown}
        aria-label={label(script, 'Qaysi soʻz?')}
        role="group"
      >
        {word('left')}
        <div className={styles.clueWrap}>
          <span data-testid="clue" className={styles.clue} lang="en">
            <span>{view.clue.text}</span>
          </span>
          <span className={styles.caption}>{label(script, 'Maʼnosi')}</span>
        </div>
        {word('right')}
      </div>

      <div className={styles.arrows}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => answer('left')}
          aria-label={label(script, 'Chap')}
        >
          ←
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => answer('right')}
          aria-label={label(script, 'Oʻng')}
        >
          →
        </button>
      </div>

      {reveal && (
        <button
          type="button"
          data-testid="reveal"
          aria-live="polite"
          className={styles.reveal}
          onClick={skip}
        >
          <span className={styles.revealHead}>
            <span aria-hidden="true" className={styles.cross}>
              ✕
            </span>
            <span className={styles.revealTitle}>
              {label(script, reveal.kind === 'timeout' ? 'Vaqt tugadi' : 'Xato')}
            </span>
            <span className={styles.pill}>{label(script, '−1 jon')}</span>
          </span>
          {ordered.map((r) => (
            <span
              key={r.key}
              className={styles.revealRow}
              data-owner={r.key === ordered[0]!.key ? '' : undefined}
            >
              <span className={styles.rowTag}>{r.key === 'uz' ? 'UZ' : 'TR'}</span>
              {r.key === 'uz' ? (
                <UzText
                  latn={view.card.uz.uz.latn}
                  cyrl={view.card.uz.uz.cyrl}
                  script={script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'}
                  className={styles.revealWord}
                />
              ) : (
                <SourceText
                  lang={view.card.other.lang}
                  text={view.card.other.text}
                  className={styles.revealWord}
                />
              )}
              {r.meaning !== undefined && (
                <span lang="en" className={styles.meaning}>
                  {r.meaning}
                </span>
              )}
            </span>
          ))}
          <span className={styles.hint}>
            {label(script, 'Davom etish uchun bosing yoki')} Space
          </span>
        </button>
      )}
    </div>
  );
}
