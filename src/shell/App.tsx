import { UpdateToast } from './UpdateToast';

export function App() {
  return (
    <main>
      <h1>Uzbekible</h1>
      <p>Games that make Uzbek happen.</p>
      <UpdateToast sw={'serviceWorker' in navigator ? navigator.serviceWorker : undefined} />
    </main>
  );
}
