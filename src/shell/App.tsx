import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { systemClock, type Clock } from '@core/clock';
import { loadItems } from '@core/content';
import { createLearningLog } from '@core/learning-log';
import { createRng, seedFrom } from '@core/random';
import type { StorageBackend } from '@core/storage';
import { getGame, GAMES, type AnyGameDefinition } from '@games/registry';
import { registerJuft } from '@games/juft/definition';
import type { GameSettings } from '@games/types';
import { LevelMap, SettingsPanel, type Script } from '@ui/index';
import { label } from '../ui/labels';
import { isGalleryPath } from '../dev/gallery/route';
import { GameShell } from './GameShell';
import { createProgressStore, type Progress } from './progress';
import {
  applyTheme,
  createSettingsStore,
  exportLog,
  resetProgress,
  setScript,
  setTheme,
  toggleLanguage,
} from './settings';
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
        setGames([...GAMES]);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [loadPack]);

  const progressStores = useMemo(
    () => new Map(games.map((g) => [g.id, createProgressStore(g.id, storage)])),
    [games, storage],
  );
  const progressOf = (id: string) => progressStores.get(id)!;

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
      <>
        <button type="button" onClick={home}>
          {t('Orqaga')}
        </button>
        <SettingsPanel
          languages={settings.languages}
          script={settings.script}
          theme={settings.theme}
          onToggleLanguage={(l) => toggleLanguage(settingsStore, l)}
          onScript={(s) => setScript(settingsStore, s)}
          onTheme={(th) => setTheme(settingsStore, th)}
          onExport={(f) => exportLog(log, f)}
          onReset={() =>
            resetProgress(
              games.map((g) => progressOf(g.id)),
              log,
            )
          }
        />
      </>
    );
  } else if (screen.name === 'map' || screen.name === 'play') {
    const def = games.find((g) => g.id === screen.gameId);
    const progress = progressOf(screen.gameId);
    if (!def) {
      body = null;
    } else if (screen.name === 'play') {
      const { level } = screen;
      body = (
        <GameShell
          definition={def}
          level={level}
          settings={gameSettings}
          history={log.aggregates()}
          clock={clock}
          progress={progress}
          log={log}
          countdownMs={countdownMs}
          onNext={() => setScreen({ name: 'play', gameId: def.id, level: level + 1 })}
          onMap={() => setScreen({ name: 'map', gameId: def.id })}
        />
      );
    } else {
      body = (
        <MapScreen
          def={def}
          progress={progress}
          script={script}
          onSelect={(level) => setScreen({ name: 'play', gameId: def.id, level })}
          onBack={home}
        />
      );
    }
  } else {
    body = (
      <main>
        <h1>Uzbekible</h1>
        <p>{t('O‘yinlar bilan o‘zbek tili.')}</p>
        {failed && <p role="alert">{t('Yuklab boʻlmadi. Internetni tekshiring.')}</p>}
        <nav>
          {games.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setScreen({ name: 'map', gameId: g.id })}
            >
              {script === 'cyrl' ? g.title.uzCyrl : g.title.uzLatn}
            </button>
          ))}
          <button type="button" onClick={() => setScreen({ name: 'settings' })}>
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
  script,
  onSelect,
  onBack,
}: {
  def: AnyGameDefinition;
  progress: ReturnType<typeof createProgressStore>;
  script: Script;
  onSelect: (level: number) => void;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState<Progress>(() => progress.get());
  useEffect(() => progress.subscribe(setCurrent), [progress]);
  const chapters = def.chapters ?? [{ id: def.id, name: def.title.uzLatn, levels: 30 }];
  return (
    <>
      <button type="button" onClick={onBack}>
        {label(script, 'Orqaga')}
      </button>
      <LevelMap chapters={chapters} progress={current} script={script} onSelect={onSelect} />
    </>
  );
}
