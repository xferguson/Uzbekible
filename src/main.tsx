import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './shell/App';
import { installTestHooks } from './shell/testHooks';

const testBuild = import.meta.env.DEV || ['test', 'e2e'].includes(import.meta.env.MODE);
installTestHooks(window, window.location.search, testBuild);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
