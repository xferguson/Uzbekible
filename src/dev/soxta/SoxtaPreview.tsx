/**
 * TEMPORARY (J5): dev-only harness that mounts the Soxta board in a fixed state so it can be screenshotted
 * against the J4 mockups before J6 registers the game. J6 deletes this folder and its hook in `shell/App.tsx`.
 * `?state=idle|correct|wrong|timeout&script=latn|cyrl&streak=<n>`. The clock is frozen, so the timer and any
 * feedback hold stay exactly as drawn.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createFakeClock } from '@core/clock';
import { makeItem } from '@core/content/fixtures';
import { createRng } from '@core/random';
import { createSession, type GameEvent, type Session, type SessionState } from '@core/session';
import { ScriptProvider } from '@ui/index';
import { Board } from '../../games/soxta/Board';
import type { Card } from '../../games/soxta/cards';
import {
  correctSide,
  createSoxtaRules,
  type SoxtaAction,
  type SoxtaEvent,
  type SoxtaState,
} from '../../games/soxta/rules';

const pair = (
  id: string,
  latn: string,
  cyrl: string,
  uzGloss: string,
  tr: string,
  trGloss: string,
): Card => ({
  id,
  uz: makeItem({ id, uz: { latn, cyrl }, glossEn: uzGloss }),
  other: { lang: 'tr', text: tr },
  clues: { uz: uzGloss, other: trGloss },
  tier: 1,
});

export const PREVIEW_CARDS: Card[] = [
  pair('uz-kutmoq', 'kutmoq', 'кутмоқ', 'to wait', 'gütmek', 'to herd'),
  pair('uz-hozir', 'hozir', 'ҳозир', 'now', 'hazır', 'ready'),
  pair('uz-tashlamoq', 'tashlamoq', 'ташламоқ', 'to throw', 'taşlamak', 'to stone'),
  pair('uz-yomon', 'yomon', 'ёмон', 'bad', 'yaman', 'formidable'),
];

export type PreviewState = 'idle' | 'correct' | 'wrong' | 'timeout';

type Sess = Session<SoxtaState, SoxtaAction, SoxtaEvent | GameEvent>;

/** A session already driven into `state`, on a frozen fake clock. */
export function previewSession(state: PreviewState, streak = 0) {
  const clock = createFakeClock();
  const rules = createSoxtaRules({ cards: PREVIEW_CARDS, rng: createRng(11) });
  const session = createSession({ rules, lives: 3, countdownMs: 0, clock }) as Sess;
  session.start();
  const right = () => correctSide(session.getState().game.current);
  const wrong = () => (right() === 'left' ? 'right' : 'left');
  for (let i = 0; i < streak; i++) session.dispatch({ type: 'swipe', side: right() });
  return { clock, session, drive: () => drive(session, state, right, wrong) };
}

function drive(
  session: Sess,
  state: PreviewState,
  right: () => 'left' | 'right',
  wrong: () => 'left' | 'right',
) {
  if (state === 'correct') session.dispatch({ type: 'swipe', side: right() });
  else if (state === 'wrong') session.dispatch({ type: 'swipe', side: wrong() });
  else if (state === 'timeout') session.dispatch({ type: 'tick', ms: 60_000 });
}

export function SoxtaPreview({ search = window.location.search }: { search?: string }) {
  const q = new URLSearchParams(search);
  const state = (q.get('state') ?? 'idle') as PreviewState;
  const script = q.get('script') === 'cyrl' ? 'cyrl' : 'latn';
  const streak = Number(q.get('streak') ?? 0) || 0;
  const view = useMemo(() => previewSession(state, streak), [state, streak]);
  const settings = { sourceLangs: ['tr'], script } as const;
  return (
    <ScriptProvider script={script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn'}>
      <div style={{ blockSize: '100dvh', background: 'var(--color-ground)' }}>
        <PreviewBoard view={view} settings={settings} />
      </div>
    </ScriptProvider>
  );
}

function PreviewBoard({
  view,
  settings,
}: {
  view: ReturnType<typeof previewSession>;
  settings: { sourceLangs: readonly ['tr']; script: 'latn' | 'cyrl' };
}) {
  // The board subscribes in its own effect, which runs before this one: drive the session once it is listening.
  const [, setTick] = useState(0);
  const driven = useRef(false);
  useEffect(() => {
    if (driven.current) return;
    driven.current = true;
    view.drive();
    setTick(1);
  }, [view]);
  return (
    <Board
      spec={{ level: 1, seed: 'preview', lives: 3, params: {} }}
      settings={settings}
      state={view.session.getState() as SessionState<SoxtaState>}
      dispatch={view.session.dispatch}
      subscribe={view.session.subscribe as never}
      clock={view.clock}
    />
  );
}
