/** The ready card's miniature of a Soxta card (mockup J4 "ready"): the Uzbek word, its clue, the false friend. */
import { SourceText, UzText } from '@ui/index';
import styles from './Board.module.css';
import { ClueOctagon } from './icons.tsx';

/** tun (night) and Turkish dün (yesterday): the mockup's example pair. */
const UZ = { latn: 'tun', cyrl: 'тун' };
const TR = 'dün';
const CLUE = 'night';

export function Sample({ script }: { script: 'latn' | 'cyrl' }) {
  return (
    <div className={styles.sample} data-testid="ready-sample">
      <span className={styles.sampleTile}>
        <span className={styles.tag}>UZ</span>
        <UzText latn={UZ.latn} cyrl={UZ.cyrl} script={script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'} />
      </span>
      <span className={`${styles.clue} ${styles.sampleClue}`} lang="en">
        <ClueOctagon className={styles.octagon} />
        <span className={styles.clueText}>{CLUE}</span>
      </span>
      <span className={styles.sampleTile} data-false="">
        <span className={styles.tag}>TR</span>
        <SourceText lang="tr" text={TR} />
      </span>
    </div>
  );
}
