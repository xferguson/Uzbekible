import { lazy, Suspense } from 'react';
import { isGalleryPath } from '../dev/gallery/route';
import { UpdateToast } from './UpdateToast';

// Dev-only: the gallery chunk is dropped from production builds (import.meta.env.DEV is false there).
const Gallery = import.meta.env.DEV
  ? lazy(() => import('../dev/gallery').then((m) => ({ default: m.Gallery })))
  : null;

export function App() {
  if (Gallery && isGalleryPath(window.location.pathname)) {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }
  return (
    <main>
      <h1>Uzbekible</h1>
      <p>Games that make Uzbek happen.</p>
      <UpdateToast sw={'serviceWorker' in navigator ? navigator.serviceWorker : undefined} />
    </main>
  );
}
