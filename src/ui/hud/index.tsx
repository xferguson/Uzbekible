import { label, langProps, type Script } from '../labels';
import { khatam, pathData } from '../motif/geometry';
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

/** One glazed tile per life with a turquoise star (D1 motif); a lost life is a dark tile with crack lines. */
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
            viewBox="0 0 22 22"
            data-cracked={cracked}
            className={`${styles.life} ${cracked ? styles.cracked : ''}`}
            aria-hidden="true"
          >
            <rect className={styles.lifeTile} x="1" y="1" width="20" height="20" rx="5" />
            {cracked ? (
              <path className={styles.crack} d="M11 1 L9 8 L13 12 L10 21 M9 8 L3 7 M13 12 L20 13" />
            ) : (
              <path className={styles.lifeStar} d={pathData(khatam(6), { x: 11, y: 11 })} />
            )}
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
