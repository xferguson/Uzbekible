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
  groupDigits,
  Lives,
  PatternBg,
  RosetteBand,
  SourceText,
  Tile,
  UzText,
  useSwipe,
} from '@ui/index';
import { streakMultiplier } from './config.ts';
import {
  Badge,
  ClockIcon,
  ClueOctagon,
  Cracks,
  Go,
  MiniOctagon,
  MiniStar,
  PauseIcon,
  StarBloom,
} from './icons.tsx';
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

/** A correct answer also shows the reveal panel (mockup J4), so it holds as long as a miss. */
export const CORRECT_MS = 1400;
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
  points?: number;
  card: SoxtaCurrent;
};

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
  onPause,
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
        const ev = e as { type: string; side?: Side; points?: number };
        const kind =
          ev.type === 'swipeCorrect'
            ? 'correct'
            : ev.type === 'swipeWrong'
              ? 'wrong'
              : ev.type === 'timeout'
                ? 'timeout'
                : undefined;
        if (!kind) return;
        const fb: Feedback = {
          kind,
          card: shown.current,
          ...(ev.side && { picked: ev.side }),
          ...(ev.points !== undefined && { points: ev.points }),
        };
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
    if (feedback && e.key === ' ') {
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

  /** What a tile looks like now (mockup J4): drawn by the board, so the shared Tile stays idle. */
  const look = (side: Side): 'ok' | 'out' | 'wrong' | 'answer' | undefined => {
    if (!feedback) return undefined;
    if (feedback.kind === 'correct') return side === feedback.picked ? 'ok' : 'out';
    if (feedback.kind === 'wrong') return side === feedback.picked ? 'wrong' : 'answer';
    return side === answerSide ? 'answer' : 'out';
  };
  const sr = (side: Side): string | undefined =>
    ({ ok: 'toʻgʻri', wrong: 'xato', answer: 'toʻgʻri javob', out: undefined })[
      look(side) ?? 'out'
    ];

  const word = (side: Side) => {
    const isUz = side === view.uzSide;
    const text = isUz
      ? script === 'cyrl'
        ? view.card.uz.uz.cyrl
        : view.card.uz.uz.latn
      : view.card.other.text;
    const kind = look(side);
    const note = sr(side);
    return (
      <div
        className={styles.cell}
        data-side={side}
        data-look={kind}
        data-answer={feedback && side === answerSide ? '' : undefined}
        data-wrong={kind === 'wrong' ? '' : undefined}
      >
        {kind === 'ok' && <StarBloom className={styles.bloom} />}
        <Tile label={note ? `${text}, ${label(script, note)}` : text} onSelect={() => answer(side)}>
          <span data-testid={`tile-${side}`} className={styles.tileFace}>
            <span className={styles.tag} data-tag={isUz ? 'uz' : 'tr'}>
              {isUz ? 'UZ' : 'TR'}
            </span>
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
            {!feedback && <Go side={side} className={styles.go} />}
          </span>
        </Tile>
        {kind === 'wrong' && <Cracks className={styles.cracks} />}
        {(kind === 'ok' || kind === 'answer') && <Badge kind="ok" className={styles.badge} />}
        {kind === 'wrong' && <Badge kind="bad" className={styles.badge} />}
      </div>
    );
  };

  const reveal = feedback;
  const rows = [
    { key: 'uz', meaning: view.card.clues.uz },
    { key: 'other', meaning: view.card.clues.other },
  ];
  const ordered = view.clue.kind === 'uz' ? rows : [rows[1]!, rows[0]!];
  const mult = streakMultiplier(game.streak);
  const last = state.lives === 0 || game.over;

  return (
    <div
      className={styles.board}
      data-testid="soxta-board"
      data-feedback={feedback?.kind}
      data-reduced={reducedMotion ? '' : undefined}
    >
      <PatternBg className={styles.pattern} />
      <header className={styles.hud}>
        <div className={styles.hudTop}>
          {onPause && (
            <button
              type="button"
              className={styles.pause}
              aria-label={label(script, 'Pauza')}
              onClick={onPause}
            >
              <PauseIcon className={styles.pauseIcon} />
            </button>
          )}
          <div className={styles.stats}>
            <span className={styles.stat} aria-label={label(script, 'Ball')}>
              <MiniStar fill="var(--color-gold)" className={styles.statIcon} />
              <span data-testid="score">{groupDigits(game.score)}</span>
            </span>
            <span className={styles.stat} aria-label={label(script, 'Seriya')}>
              <MiniOctagon className={styles.statIcon} />
              <span data-testid="streak">{game.streak}</span>
            </span>
            <span
              className={styles.mult}
              data-on={mult > 1 ? '' : undefined}
              aria-hidden={mult > 1 ? undefined : true}
            >
              <MiniStar fill="var(--color-text)" className={styles.multIcon} />×{mult}
            </span>
          </div>
          <span className={styles.grow} />
          <Lives lives={state.lives} max={spec.lives} script={script} />
        </div>
      </header>
      <div className={styles.band} aria-hidden="true">
        <RosetteBand width={1600} height={16} />
      </div>

      <div className={styles.play}>
        <div
          data-testid="timer"
          data-segments={left}
          data-warn={warn ? '' : undefined}
          data-timeout={feedback?.kind === 'timeout' ? '' : undefined}
          role="timer"
          aria-label={label(script, 'Vaqt')}
          className={styles.timer}
        >
          <ClockIcon className={styles.clock} />
          <span className={styles.segments}>
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span key={i} className={styles.segment} data-on={i < left ? '' : undefined} />
            ))}
          </span>
          <span className={styles.seconds}>
            {warn && '!'}
            {feedback?.kind === 'timeout' ? '0.0' : (Math.max(0, timed) / 1000).toFixed(1)}
          </span>
        </div>

        {/* In the flow, above the tiles, so it never covers a tile or its badge. */}
        {feedback?.kind === 'timeout' && (
          <span data-testid="timeout-pill" className={styles.banner}>
            <ClockIcon className={styles.bannerIcon} />
            {label(script, 'Vaqt tugadi')}
          </span>
        )}
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
              <ClueOctagon className={styles.octagon} />
              <span className={styles.clueText}>{view.clue.text}</span>
            </span>
            <span className={styles.caption}>{label(script, 'maʼnosi')}</span>
          </div>
          {word('right')}
        </div>

        <div className={styles.under}>
          {!reveal && (
            <div className={styles.arrows}>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => answer('left')}
                aria-label={label(script, 'Chap')}
              >
                <Go side="left" className={styles.arrowIcon} />
                <kbd className={styles.kbd}>←</kbd>
              </button>
              <span />
              <button
                type="button"
                className={styles.arrow}
                onClick={() => answer('right')}
                aria-label={label(script, 'Oʻng')}
              >
                <kbd className={styles.kbd}>→</kbd>
                <Go side="right" className={styles.arrowIcon} />
              </button>
            </div>
          )}

          {reveal && (
            <button
              type="button"
              data-testid="reveal"
              data-kind={reveal.kind}
              aria-live="polite"
              className={styles.reveal}
              onClick={skip}
            >
              <span className={styles.revealHead}>
                <Badge
                  kind={reveal.kind === 'correct' ? 'ok' : reveal.kind === 'wrong' ? 'bad' : 'time'}
                  className={styles.revealBadge}
                />
                <span className={styles.revealTitle}>
                  {label(
                    script,
                    reveal.kind === 'timeout'
                      ? 'Vaqt tugadi'
                      : reveal.kind === 'wrong'
                        ? 'Xato'
                        : 'Toʻgʻri!',
                  )}
                </span>
                <span
                  className={styles.pill}
                  data-good={reveal.kind === 'correct' ? '' : undefined}
                >
                  {reveal.kind === 'correct' ? `+${reveal.points ?? 0}` : label(script, '−1 jon')}
                </span>
              </span>
              {ordered.map((r, i) => (
                <span
                  key={r.key}
                  className={styles.revealRow}
                  data-owner={i === 0 ? '' : undefined}
                >
                  <span className={styles.rowTag} lang="en">
                    {r.key === 'uz' ? 'UZ' : 'TR'}
                  </span>
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
                  <span lang="en" className={styles.meaning}>
                    {r.meaning ?? ''}
                  </span>
                </span>
              ))}
              <span className={styles.hint} lang="en">
                <span>
                  {last ? 'Last life lost · results next' : 'Tap or press Space to continue'}
                </span>
                {!last && <span>next card in {REVEAL_MS / 1000} s</span>}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
