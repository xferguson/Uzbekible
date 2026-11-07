import { useState } from 'react';
import { label, langProps, type Script } from '../labels';
import styles from './LevelMap.module.css';

export interface ChapterInfo {
  id: string;
  /** Building name, Latin spelling. */
  name: string;
  /** Number of levels in this chapter. */
  levels: number;
}

/** The slice of a game's stored progress the map needs. */
export interface MapProgress {
  /** Highest level the player may start. */
  unlocked: number;
  best: Record<number, { score: number; stars: 0 | 1 | 2 | 3 }>;
}

export type LevelCellState = 'cleared' | 'current' | 'locked';

export interface LevelMapProps {
  chapters: readonly ChapterInfo[];
  progress: MapProgress;
  onSelect: (level: number) => void;
  script?: Script;
}

export function levelState(level: number, progress: MapProgress): LevelCellState {
  if (progress.best[level]) return 'cleared';
  return level <= progress.unlocked ? 'current' : 'locked';
}

/** Index of the chapter holding `level`; levels past the end belong to the last chapter. */
export function chapterOf(level: number, chapters: readonly ChapterInfo[]): number {
  let first = 1;
  for (let i = 0; i < chapters.length; i++) {
    first += chapters[i]!.levels;
    if (level < first) return i;
  }
  return Math.max(0, chapters.length - 1);
}

const firstLevelOf = (chapters: readonly ChapterInfo[], index: number) =>
  1 + chapters.slice(0, index).reduce((n, c) => n + c.levels, 0);

function cellName(level: number, state: LevelCellState, progress: MapProgress, script: Script) {
  const best = progress.best[level];
  const base = `${level}-daraja`;
  if (state === 'locked') return label(script, `${base}, qulflangan`);
  if (!best) return label(script, `${base}, joriy`);
  return label(script, `${base}, ${best.stars} yulduz, eng yaxshi ${best.score}`);
}

/** Mosaic facade progress map: one building per chapter, levels climb upward, any unlocked level can be replayed. */
export function LevelMap({ chapters, progress, onSelect, script = 'latn' }: LevelMapProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const active = picked ?? chapterOf(progress.unlocked, chapters);
  const chapter = chapters[active];
  const first = firstLevelOf(chapters, active);
  const levels = chapter ? Array.from({ length: chapter.levels }, (_, i) => first + i) : [];
  const cols = 3;

  return (
    <section
      className={styles.map}
      aria-label={label(script, 'Daraja xaritasi')}
      {...langProps(script)}
    >
      <nav className={styles.skyline} aria-label={label(script, 'Binolar')}>
        {chapters.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={styles.building}
            data-active={i === active}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => setPicked(i)}
          >
            <span className={styles.buildingName}>{label(script, c.name)}</span>
            <span className={styles.buildingCount}>{c.levels}</span>
          </button>
        ))}
      </nav>
      <ol className={styles.facade} style={{ ['--cols' as string]: cols }}>
        {levels.map((level, i) => {
          // Rows are stacked bottom-up (levels climb), columns stay left-to-right; DOM and tab order stay ascending.
          const order =
            (Math.ceil(levels.length / cols) - 1 - Math.floor(i / cols)) * cols + (i % cols);
          const state = levelState(level, progress);
          const stars = progress.best[level]?.stars ?? 0;
          const locked = state === 'locked';
          return (
            <li key={level} className={styles.row} style={{ order }}>
              <button
                type="button"
                className={styles.cell}
                data-state={state}
                data-stars={stars}
                aria-disabled={locked || undefined}
                aria-label={cellName(level, state, progress, script)}
                onClick={locked ? undefined : () => onSelect(level)}
              >
                <span aria-hidden="true" className={styles.num}>
                  {level}
                </span>
                <span aria-hidden="true" className={styles.pips}>
                  {Array.from({ length: stars }, (_, i) => (
                    <span key={i} data-pip className={styles.pip} />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
