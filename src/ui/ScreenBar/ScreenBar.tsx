import { label, langProps, type Script } from '../labels';
import styles from './ScreenBar.module.css';

export interface ScreenBarProps {
  /** Screen title, already in the player's script. */
  title?: string;
  /** Leaves this screen, one step up (level → map → home). */
  onBack: () => void;
  /** Leaves straight to the home screen; shown when the screen is more than one step from home. */
  onHome?: () => void;
  script?: Script;
}

/** Top bar on every screen but home, so there is always a visible way out. */
export function ScreenBar({ title, onBack, onHome, script = 'latn' }: ScreenBarProps) {
  return (
    <header className={styles.bar} {...langProps(script)}>
      <button type="button" className={styles.button} onClick={onBack}>
        <span aria-hidden="true" className={styles.icon}>
          ‹
        </span>
        <span>{label(script, 'Orqaga')}</span>
      </button>
      {title && <h2 className={styles.title}>{title}</h2>}
      {onHome && (
        <button
          type="button"
          className={`${styles.button} ${styles.close}`}
          aria-label={label(script, 'Bosh sahifa')}
          onClick={onHome}
        >
          <span aria-hidden="true" className={styles.icon}>
            ✕
          </span>
        </button>
      )}
    </header>
  );
}
