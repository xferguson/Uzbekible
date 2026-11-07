import { useEffect, useState } from 'react';
import { watchForUpdate } from './registerSW';

/** "New version" toast: the app updates itself; the toast just offers a reload. */
export function UpdateToast({ sw }: { sw?: ServiceWorkerContainer }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    watchForUpdate({ notify: () => setVisible(true), sw });
  }, [sw]);
  if (!visible) return null;
  return (
    <div role="status" className="update-toast">
      <span>A new version is available.</span>{' '}
      <button type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
      <button type="button" aria-label="Dismiss" onClick={() => setVisible(false)}>
        ×
      </button>
    </div>
  );
}
