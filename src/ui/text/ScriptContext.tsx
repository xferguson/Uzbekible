import { createContext, useContext, type ReactNode } from 'react';
import { type UzScript } from '@core/text';

const ScriptContext = createContext<UzScript>('uz-Latn');

/** Supplies the player's Uzbek script setting to every `UzText` below. */
export function ScriptProvider({ script, children }: { script: UzScript; children: ReactNode }) {
  return <ScriptContext value={script}>{children}</ScriptContext>;
}

export function useUzScript(): UzScript {
  return useContext(ScriptContext);
}
