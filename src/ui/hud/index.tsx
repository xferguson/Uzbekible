import { label, langProps, type Script } from '../labels';
import styles from './hud.module.css';

interface Common {
  script?: Script;
}

/** m:ss, rounded down. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function Timer({ ms, script = 'latn' }: Common & { ms: number }) {
  return (
    <span
      role="timer"
      aria-label={label(script, 'Vaqt')}
      className={styles.stat}
      {...langProps(script)}
    >
      <span className={styles.value}>{formatTime(ms)}</span>
    </span>
  );
}

/** One glazed tile per life; a lost life shows crack lines as well as a paler glaze. */
export function Lives({ lives, max, script = 'latn' }: Common & { lives: number; max: number }) {
  return (
    <span
      role="img"
      aria-label={`${label(script, 'Jon')} ${lives}/${max}`}
      className={styles.lives}
      {...langProps(script)}
    >
      {Array.from({ length: max }, (_, i) => {
        const cracked = i >= lives;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            data-cracked={cracked}
            className={`${styles.life} ${cracked ? styles.cracked : ''}`}
            aria-hidden="true"
          >
            {cracked && <path className={styles.crack} d="M12 1 L9 9 L14 13 L10 23" />}
          </svg>
        );
      })}
    </span>
  );
}

export function Score({ value, script = 'latn' }: Common & { value: number }) {
  return (
    <span aria-label={label(script, 'Ball')} className={styles.stat} {...langProps(script)}>
      <span className={styles.value}>{value}</span>
    </span>
  );
}

export function LevelBadge({ level, script = 'latn' }: Common & { level: number }) {
  return (
    <span aria-label={label(script, 'Daraja')} className={styles.stat} {...langProps(script)}>
      <span className={styles.value}>{level}</span>
    </span>
  );
}

/** Consecutive-correct streak; shown from 2 up. */
export function Combo({ count, script = 'latn' }: Common & { count: number }) {
  if (count < 2) return null;
  return (
    <span
      aria-label={label(script, 'Kombo')}
      className={`${styles.stat} ${styles.combo}`}
      {...langProps(script)}
    >
      <span className={styles.value}>×{count}</span>
    </span>
  );
}
