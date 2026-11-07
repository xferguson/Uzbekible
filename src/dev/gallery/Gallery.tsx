import { type ReactNode } from 'react';
import { scriptMeta, type TextLang } from '@core/text';
import { colors, type ThemeName } from '@design/tokens';
import { PatternBg, RosetteBand, Star8 } from '@ui/motif';
import { Combo, Countdown, LevelBadge, Lives, ResultsScreen, Score, Timer } from '@ui/index';
import styles from './Gallery.module.css';

export { isGalleryPath } from './route';
const THEMES: ThemeName[] = ['light', 'dark'];

const SPECIMENS: [TextLang, string][] = [
  ['uz-Latn', 'Oʻzbekiston: gʻisht, qalʼa, shahar'],
  ['uz-Cyrl', 'Ўзбекистон: қалъа, ғишт, ҳаво'],
  ['tr', 'Türkiye: ığdır, şehir, İstanbul'],
  ['ru', 'Россия: город, кирпич'],
  ['fa', 'ایران: شهر، آجر'],
  ['ar', 'العربية: مدينة، قلعة'],
];

function Entry({ title, children }: { title: string; children: (theme: ThemeName) => ReactNode }) {
  return (
    <section className={styles.entry} aria-label={title}>
      <h3>{title}</h3>
      <div className={styles.themes}>
        {THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className={styles.panel}>
            <span className={styles.label}>{theme}</span>
            {children(theme)}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Dev-only catalogue: every shared component × state × theme. Add an `Entry` per new component. */
export function Gallery() {
  return (
    <main className={styles.gallery}>
      <h1>Component gallery</h1>

      <Entry title="Palette">
        {(theme) => (
          <ul className={styles.swatches}>
            {Object.entries(colors[theme]).map(([name, value]) => (
              <li key={name}>
                <span className={styles.chip} style={{ background: `var(--color-${name})` }} />
                <code>--color-{name}</code> <small>{value}</small>
              </li>
            ))}
          </ul>
        )}
      </Entry>

      <Entry title="Type specimens">
        {() => (
          <ul className={styles.specimens}>
            {SPECIMENS.map(([lang, text]) => {
              const meta = scriptMeta(lang);
              return (
                <li
                  key={lang}
                  lang={meta.bcp47}
                  dir={meta.dir}
                  style={{ fontFamily: meta.fontStack }}
                >
                  {text}
                </li>
              );
            })}
          </ul>
        )}
      </Entry>

      <Entry title="Star8">
        {() => (
          <div className={styles.row}>
            <Star8 size={96} />
            <Star8 size={48} />
            <Star8 size={96} variant="outline" />
            <Star8 size={24} variant="outline" />
          </div>
        )}
      </Entry>

      <Entry title="RosetteBand">
        {() => (
          <div className={styles.row}>
            <RosetteBand width={320} height={40} />
          </div>
        )}
      </Entry>

      <Entry title="PatternBg">
        {() => (
          <div className={styles.bg}>
            <PatternBg />
          </div>
        )}
      </Entry>

      <Entry title="HUD">
        {() => (
          <div className={styles.row}>
            <LevelBadge level={12} />
            <Timer ms={83_000} />
            <Lives lives={2} max={3} />
            <Score value={640} />
            <Combo count={4} />
          </div>
        )}
      </Entry>

      <Entry title="Countdown">
        {() => (
          <div className={styles.row}>
            <Countdown remainingMs={2_000} />
            <Countdown remainingMs={0} />
          </div>
        )}
      </Entry>

      <Entry title="ResultsScreen">
        {() => (
          <div className={styles.row}>
            <ResultsScreen
              won
              stars={2}
              score={420}
              timeMs={75_000}
              mistakes={1}
              hints={0}
              newBest
              onNext={() => {}}
              onReplay={() => {}}
              onMap={() => {}}
            />
            <ResultsScreen
              won={false}
              stars={0}
              score={0}
              timeMs={30_000}
              mistakes={3}
              hints={0}
              newBest={false}
              onReplay={() => {}}
              onMap={() => {}}
            />
          </div>
        )}
      </Entry>
    </main>
  );
}
