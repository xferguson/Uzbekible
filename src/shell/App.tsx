import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { systemClock, type Clock } from '@core/clock';
import { loadItems } from '@core/content';
import { createLearningLog } from '@core/learning-log';
import { createRng, seedFrom } from '@core/random';
import type { StorageBackend } from '@core/storage';
import { getGame, GAMES, type AnyGameDefinition } from '@games/registry';
import { registerImlo } from '@games/imlo/definition';
import { registerJuft } from '@games/juft/definition';
import type { GameSettings } from '@games/types';
import { LevelMap, ModePicker, ScreenBar, SettingsPanel, type Script } from '@ui/index';
import { label } from '../ui/labels';
import { isGalleryPath } from '../dev/gallery/route';
import { GameShell } from './GameShell';
import { createModeStore, createProgressStore, type Progress } from './progress';
import {
  applyTheme,
  createSettingsStore,
  exportLog,
  resetProgress,
  setScript,
  setTheme,
  toggleLanguage,
} from './settings';
import styles from './App.module.css';
import { UpdateToast } from './UpdateToast';

// Dev-only: the gallery chunk is dropped from production builds (import.meta.env.DEV is false there).
const Gallery = import.meta.env.DEV
  ? lazy(() => import('../dev/gallery').then((m) => ({ default: m.Gallery })))
  : null;

export interface AppProps {
  /** Resolves to the decoded `items.v1.json`. Injected in tests. */
  loadPack?: () => Promise<unknown>;
  clock?: Clock;
  backend?: StorageBackend;
  /** Length of the 3-2-1 before play. */
  countdownMs?: number;
}

const fetchPack = async (): Promise<unknown> => {
  const res = await fetch(`${import.meta.env.BASE_URL}content/items.v1.json`);
  if (!res.ok) throw new Error(`content: ${res.status}`);
  return res.json();
};

type Screen =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'map'; gameId: string }
  | { name: 'play'; gameId: string; level: number };

export function App(props: AppProps) {
  if (Gallery && isGalleryPath(window.location.pathname)) {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }
  return <Home {...props} />;
}

function Home({ loadPack = fetchPack, clock = systemClock, backend, countdownMs }: AppProps) {
  const storage = useMemo(() => (backend ? { backend } : undefined), [backend]);
  const settingsStore = useMemo(() => createSettingsStore(storage), [storage]);
  const log = useMemo(
    () =>
      createLearningLog({
        clock,
        sessionId: `s${seedFrom(String(clock.now())).toString(16)}${createRng(clock.now()).int(0, 9999)}`,
        storage,
      }),
    [clock, storage],
  );
  const [settings, setSettings] = useState(() => settingsStore.get());
  useEffect(() => settingsStore.subscribe(setSettings), [settingsStore]);
  useEffect(() => applyTheme(settings.theme), [settings.theme]);

  const [games, setGames] = useState<readonly AnyGameDefinition[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadPack()
      .then((json) => {
        if (!live) return;
        const items = loadItems(json);
        if (!getGame('juft')) registerJuft(items);
        if (!getGame('imlo')) registerImlo(items);
        setGames([...GAMES]);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [loadPack]);

  // One store per mode for a game with modes (key `<id>:<mode>`), one store for a game without.
  const progressStores = useMemo(
    () =>
      new Map(
        games.flatMap((g) =>
          g.modes
            ? g.modes.map(
                (m) => [`${g.id}:${m.id}`, createProgressStore(g.id, storage, m.id)] as const,
              )
            : [[g.id, createProgressStore(g.id, storage)] as const],
        ),
      ),
    [games, storage],
  );
  const modeStore = useMemo(() => createModeStore(storage), [storage]);
  const [chosen, setChosen] = useState(() => modeStore.get());
  useEffect(() => modeStore.subscribe(setChosen), [modeStore]);
  /** The mode in force for a game: the remembered one if it still exists, else the first. */
  const modeOf = (g: AnyGameDefinition) =>
    g.modes && (g.modes.find((m) => m.id === chosen[g.id]) ?? g.modes[0])?.id;
  const progressOf = (g: AnyGameDefinition) =>
    progressStores.get(g.modes ? `${g.id}:${modeOf(g)}` : g.id)!;

  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const script: Script = settings.script === 'uz-Cyrl' ? 'cyrl' : 'latn';
  const t = (latn: string) => label(script, latn);
  const gameSettings: GameSettings = {
    sourceLangs: settings.languages,
    script,
  };
  const home = () => setScreen({ name: 'home' });

  let body;
  if (screen.name === 'settings') {
    body = (
      <main className={styles.page}>
        <ScreenBar onBack={home} script={script} />
        <SettingsPanel
          languages={settings.languages}
          script={settings.script}
          theme={settings.theme}
          onToggleLanguage={(l) => toggleLanguage(settingsStore, l)}
          onScript={(s) => setScript(settingsStore, s)}
          onTheme={(th) => setTheme(settingsStore, th)}
          onExport={(f) => exportLog(log, f)}
          onReset={() => resetProgress([...progressStores.values()], log)}
        />
      </main>
    );
  } else if (screen.name === 'map' || screen.name === 'play') {
    const def = games.find((g) => g.id === screen.gameId);
    if (!def) {
      body = null;
    } else if (screen.name === 'play') {
      const { level } = screen;
      const progress = progressOf(def);
      const toMap = () => setScreen({ name: 'map', gameId: def.id });
      body = (
        <main className={`${styles.page} ${styles.wide}`}>
          <ScreenBar
            title={script === 'cyrl' ? def.title.uzCyrl : def.title.uzLatn}
            onBack={toMap}
            onHome={home}
            script={script}
          />
          <GameShell
            definition={def}
            level={level}
            mode={modeOf(def)}
            settings={gameSettings}
            history={log.aggregates()}
            clock={clock}
            progress={progress}
            log={log}
            countdownMs={countdownMs}
            onNext={() => setScreen({ name: 'play', gameId: def.id, level: level + 1 })}
            onMap={toMap}
          />
        </main>
      );
    } else {
      body = (
        <MapScreen
          key={modeOf(def) ?? def.id}
          def={def}
          progress={progressOf(def)}
          mode={modeOf(def)}
          onMode={(id) => modeStore.update((m) => ({ ...m, [def.id]: id }))}
          script={script}
          onSelect={(level) => setScreen({ name: 'play', gameId: def.id, level })}
          onBack={home}
        />
      );
    }
  } else {
    body = (
      <main className={styles.page}>
        <h1 className={styles.title}>Uzbekible</h1>
        <p className={styles.tagline}>{t('O‘yinlar bilan o‘zbek tili.')}</p>
        {failed && <p role="alert">{t('Yuklab boʻlmadi. Internetni tekshiring.')}</p>}
        <nav className={styles.games}>
          {games.map((g) => (
            <button
              key={g.id}
              type="button"
              className={styles.game}
              onClick={() => setScreen({ name: 'map', gameId: g.id })}
            >
              {script === 'cyrl' ? g.title.uzCyrl : g.title.uzLatn}
            </button>
          ))}
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setScreen({ name: 'settings' })}
          >
            {t('Sozlamalar')}
          </button>
        </nav>
      </main>
    );
  }

  return (
    <>
      {body}
      <UpdateToast sw={'serviceWorker' in navigator ? navigator.serviceWorker : undefined} />
    </>
  );
}

function MapScreen({
  def,
  progress,
  mode,
  onMode,
  script,
  onSelect,
  onBack,
}: {
  def: AnyGameDefinition;
  progress: ReturnType<typeof createProgressStore>;
  mode?: string;
  onMode: (id: string) => void;
  script: Script;
  onSelect: (level: number) => void;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState<Progress>(() => progress.get());
  useEffect(() => progress.subscribe(setCurrent), [progress]);
  const chapters = def.chapters ?? [{ id: def.id, name: def.title.uzLatn, levels: 30 }];
  return (
    <main className={styles.page}>
      <ScreenBar
        title={script === 'cyrl' ? def.title.uzCyrl : def.title.uzLatn}
        onBack={onBack}
        script={script}
      />
      {def.modes && mode !== undefined && (
        <ModePicker modes={def.modes} value={mode} script={script} onChange={onMode} />
      )}
      <LevelMap chapters={chapters} progress={current} script={script} onSelect={onSelect} />
    </main>
  );
}
