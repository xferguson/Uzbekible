import type { ReactNode } from 'react';
import type { SourceLang } from '@core/text';
import { formatTime } from '../hud';
import { Star8 } from '../motif';
import { SourceText, UzText } from '../text';
import { label, langProps, type Script } from '../labels';
import styles from './screens.module.css';

interface Common {
  script?: Script;
}

export function Countdown({ remainingMs, script = 'latn' }: Common & { remainingMs: number }) {
  return (
    <div role="status" className={styles.countdown} {...langProps(script)}>
      {remainingMs > 0 ? Math.ceil(remainingMs / 1000) : label(script, 'Bosh!')}
    </div>
  );
}

function Button({ onClick, children }: { onClick?: () => void; children: string }) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}

/** Covers the screen and replaces the board, so a pause cannot be used to study the tiles. */
export function PauseOverlay({
  onResume,
  onMap,
  onRestart,
  note,
  mapLabel = 'Xarita',
  card = false,
  script = 'latn',
}: Common & {
  onResume: () => void;
  onMap: () => void;
  /** Starts the attempt again from scratch; no button when absent. */
  onRestart?: () => void;
  /** One line under the heading (shell microcopy). */
  note?: string;
  mapLabel?: string;
  /** A white card on a veil (mockup J4) instead of the full navy sheet (D2). */
  card?: boolean;
}) {
  if (card)
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label(script, 'Pauza')}
        className={styles.veil}
        {...langProps(script)}
      >
        <div className={styles.pauseCard}>
          <h2 className={styles.pauseTitle}>{label(script, 'Pauza')}</h2>
          {note && (
            <p lang="en" className={styles.gloss}>
              {note}
            </p>
          )}
          <div className={styles.stack}>
            <WideButton primary icon="▶" onClick={onResume}>
              {label(script, 'Davom etish')}
            </WideButton>
            {onRestart && (
              <WideButton icon="↻" onClick={onRestart}>
                {label(script, 'Qayta boshlash')}
              </WideButton>
            )}
            <WideButton icon="⌂" onClick={onMap}>
              {label(script, mapLabel)}
            </WideButton>
          </div>
        </div>
      </div>
    );
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label(script, 'Pauza')}
      className={styles.overlay}
      {...langProps(script)}
    >
      <h2>{label(script, 'Pauza')}</h2>
      {note && (
        <p lang="en" className={styles.note}>
          {note}
        </p>
      )}
      <Button onClick={onResume}>{label(script, 'Davom etish')}</Button>
      {onRestart && <Button onClick={onRestart}>{label(script, 'Qayta boshlash')}</Button>}
      <Button onClick={onMap}>{label(script, mapLabel)}</Button>
    </div>
  );
}

export interface ResultsScreenProps extends Common {
  won: boolean;
  stars: 0 | 1 | 2 | 3;
  score: number;
  timeMs: number;
  mistakes: number;
  hints: number;
  newBest: boolean;
  onNext?: () => void;
  onReplay?: () => void;
  onMap: () => void;
}

export function ResultsScreen(p: ResultsScreenProps) {
  const script = p.script ?? 'latn';
  const t = (latn: string) => label(script, latn);
  return (
    <section className={styles.results} {...langProps(script)}>
      <h2>{p.won ? t('Tabriklaymiz!') : t('Yutqazdingiz')}</h2>
      {p.won && (
        <>
          <span role="img" aria-label={`${p.stars}/3`} className={styles.stars}>
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden="true" className={styles.star}>
                {i < p.stars ? '★' : '☆'}
              </span>
            ))}
          </span>
          {p.newBest && <p className={styles.best}>{t('Yangi rekord!')}</p>}
          <dl className={styles.stats}>
            {(
              [
                ['Ball', p.score],
                ['Vaqt', formatTime(p.timeMs)],
                ['Xato', p.mistakes],
                ['Maslahat', p.hints],
              ] as const
            ).map(([name, value]) => (
              <div key={name} className={styles.stat}>
                <dt>{t(name)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <div className={styles.actions}>
        {p.won && p.onNext && <Button onClick={p.onNext}>{t('Keyingi')}</Button>}
        <Button onClick={p.onReplay}>{p.won ? t('Qayta') : t('Qayta urinish')}</Button>
        <Button onClick={p.onMap}>{t('Xarita')}</Button>
      </div>
    </section>
  );
}

/** A pair missed in an endless run: the Uzbek word, the look-alike and what each means. */
export interface RunMissed {
  id: string;
  uz: { latn: string; cyrl: string };
  uzMeaning: string;
  source: { lang: SourceLang; text: string };
  sourceMeaning?: string;
}

export interface RunResultsScreenProps extends Common {
  score: number;
  /** Best score before this run. */
  previousBest: number;
  newBest: boolean;
  /** Cards answered (right, wrong or timed out). */
  cards: number;
  /** Longest streak of this run. */
  streak: number;
  correct: number;
  /** Play time of the run, for the average time per card. */
  timeMs: number;
  missed: readonly RunMissed[];
  onReplay?: () => void;
  onHome: () => void;
}

/** "1 240": thin no-break spaces between thousands (mockup J4). */
export const groupDigits = (n: number): string =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');

/** End of an endless run (Soxta, mockup J4): verdict, score, four stats, the pairs missed; Again is primary. */
export function RunResultsScreen(p: RunResultsScreenProps) {
  const script = p.script ?? 'latn';
  const t = (latn: string) => label(script, latn);
  const uzScript = script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn';
  const right = p.cards === 0 ? 0 : Math.round((p.correct / p.cards) * 100);
  const avg = p.cards === 0 ? 0 : p.timeMs / p.cards / 1000;
  const stats = [
    [p.cards, 'cards'],
    [p.streak, 'best streak'],
    [`${right}%`, 'right'],
    [`${avg.toFixed(1)}s`, 'avg time'],
  ] as const;
  return (
    <section className={styles.run} aria-label={t('Natija')} {...langProps(script)}>
      <p lang="en" className={styles.kicker}>
        Run over · three cracks
      </p>
      <h2 className={styles.verdict}>{t(p.newBest ? 'Barakalla!' : 'Yaxshi!')}</h2>
      <p lang="en" className={styles.gloss}>
        {p.newBest ? 'Well done' : 'Good'}
      </p>
      {p.newBest && (
        <p className={styles.ribbon}>
          <span aria-hidden="true">✸</span> {t('Yangi rekord!')} <small lang="en">· New best</small>
        </p>
      )}
      <p className={styles.score} data-testid="run-score">
        {groupDigits(p.score)}
      </p>
      <p lang="en" className={styles.gloss}>
        points · {p.newBest ? 'was' : 'best'} {groupDigits(p.previousBest)}
      </p>
      <dl className={styles.runStats}>
        {stats.map(([value, name]) => (
          <div key={name} className={styles.runStat}>
            <dt lang="en">{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {p.missed.length > 0 && (
        <div className={styles.missed}>
          <h3 lang="en" className={styles.kicker}>
            Worth remembering · pairs you missed
          </h3>
          <ul>
            {p.missed.map((m) => (
              <li key={m.id} className={styles.miss}>
                <svg className={styles.missIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="1" y="1" width="22" height="22" rx="4" />
                  <path d="M13 1 L11 9 L15 13 L10 18 L12 23 M11 9 L4 11 M15 13 L22 11" />
                </svg>
                <span className={styles.missText}>
                  <span className={styles.missHead}>
                    <UzText latn={m.uz.latn} cyrl={m.uz.cyrl} script={uzScript} /> ={' '}
                    <span lang="en">{m.uzMeaning}</span>
                  </span>
                  <span className={styles.missSub}>
                    <SourceText lang={m.source.lang} text={m.source.text} />
                    {m.sourceMeaning !== undefined && (
                      <>
                        {' = '}
                        <span lang="en">{m.sourceMeaning}</span>
                      </>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.stack}>
        <WideButton primary icon="↻" onClick={p.onReplay}>
          {t('Yana')}
        </WideButton>
        <WideButton icon="⌂" onClick={p.onHome}>
          {t('Bosh sahifa')}
        </WideButton>
      </div>
    </section>
  );
}

function WideButton({
  primary,
  icon,
  onClick,
  children,
}: {
  primary?: boolean;
  icon: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.wide} ${primary ? styles.primary : ''}`}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span> {children}
    </button>
  );
}

export interface ReadyCardProps extends Common {
  kicker: string;
  title: string;
  blurb: string;
  /** The game's miniature board. */
  sample: ReactNode;
  stats: readonly { label: string; value: number }[];
  onScript: (script: Script) => void;
  onStart: () => void;
}

/** Before an endless run (mockup J4 "ready"): what the game is, the best so far, the script, Start. */
export function ReadyCard(p: ReadyCardProps) {
  const script = p.script ?? 'latn';
  return (
    <section className={styles.ready} aria-label={p.title} {...langProps(script)}>
      <Star8 size={120} className={styles.readyStar} />
      <p lang="en" className={styles.kicker}>
        {p.kicker}
      </p>
      <h2 className={styles.readyTitle}>{p.title}</h2>
      <p lang="en" className={styles.blurb}>
        {p.blurb}
      </p>
      <div className={styles.sample}>{p.sample}</div>
      <dl className={styles.readyStats}>
        {p.stats.map((s) => (
          <div key={s.label} className={styles.readyStat}>
            <dt lang="en">{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <div role="radiogroup" aria-label={label(script, 'Yozuv')} className={styles.scripts}>
        {(
          [
            ['latn', 'Latin', 'Oʻzbek'],
            ['cyrl', 'Cyrillic', 'Ўзбек'],
          ] as const
        ).map(([id, name, own]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={script === id}
            className={styles.scriptOption}
            onClick={() => p.onScript(id)}
          >
            {script === id && (
              <span aria-hidden="true" className={styles.tick}>
                ✓
              </span>
            )}
            <span lang="en">{name}</span>
            <small lang={id === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'}>{own}</small>
          </button>
        ))}
      </div>
      <button type="button" className={`${styles.wide} ${styles.primary}`} onClick={p.onStart}>
        <span aria-hidden="true">▶</span> {label(script, 'Boshlash')}{' '}
        <small lang="en">· Start</small>
      </button>
    </section>
  );
}
