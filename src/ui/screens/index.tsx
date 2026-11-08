import { formatTime } from '../hud';
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
  mapLabel = 'Xarita',
  script = 'latn',
}: Common & { onResume: () => void; onMap: () => void; mapLabel?: string }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label(script, 'Pauza')}
      className={styles.overlay}
      {...langProps(script)}
    >
      <h2>{label(script, 'Pauza')}</h2>
      <Button onClick={onResume}>{label(script, 'Davom etish')}</Button>
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

export interface RunResultsScreenProps extends Common {
  score: number;
  /** Longest streak of this run. */
  streak: number;
  correct: number;
  mistakes: number;
  /** The best run so far, this one included. */
  best: { score: number; streak: number };
  newBest: boolean;
  onReplay?: () => void;
  onHome: () => void;
}

/** End of an endless run (Soxta): score, streak and the best so far; Again is the primary action. */
export function RunResultsScreen(p: RunResultsScreenProps) {
  const script = p.script ?? 'latn';
  const t = (latn: string) => label(script, latn);
  return (
    <section className={styles.results} aria-label={t('Natija')} {...langProps(script)}>
      <h2>{t('Yugurish tugadi')}</h2>
      {p.newBest && <p className={styles.best}>{t('Yangi rekord!')}</p>}
      <dl className={styles.stats}>
        {(
          [
            ['Ball', p.score],
            ['Eng uzun seriya', p.streak],
            ['Toʻgʻri', p.correct],
            ['Xato', p.mistakes],
            ['Rekord', p.best.score],
            ['Rekord seriya', p.best.streak],
          ] as const
        ).map(([name, value]) => (
          <div key={name} className={styles.stat}>
            <dt>{t(name)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.actions}>
        <Button onClick={p.onReplay}>{t('Qayta')}</Button>
        <Button onClick={p.onHome}>{t('Bosh sahifa')}</Button>
      </div>
    </section>
  );
}
