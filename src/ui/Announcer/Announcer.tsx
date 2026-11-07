import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const AnnounceContext = createContext<(message: string) => void>(() => undefined);

/** Visually hidden polite live region. */
export function Announcer({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={VISUALLY_HIDDEN}>
      {message}
    </div>
  );
}

/** Hosts the single shared live region and lets descendants announce via `useAnnounce`. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const announce = useCallback((m: string) => setMessage(m), []);
  return (
    <AnnounceContext value={announce}>
      {children}
      <Announcer message={message} />
    </AnnounceContext>
  );
}

export function useAnnounce(): (message: string) => void {
  return useContext(AnnounceContext);
}

const VISUALLY_HIDDEN = {
  position: 'absolute',
  inlineSize: 1,
  blockSize: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
