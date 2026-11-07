export interface UpdateToastDeps {
  /** Shows the "new version" toast; returns nothing. */
  notify: () => void;
  /** The service worker container (injected for tests). */
  sw?: Pick<ServiceWorkerContainer, 'controller' | 'addEventListener'>;
}

/**
 * Calls `notify` when a new service worker takes control of a page that was already
 * controlled (i.e. an update, not the first install).
 */
export function watchForUpdate({ notify, sw }: UpdateToastDeps): void {
  if (!sw) return;
  let hadController = sw.controller !== null;
  sw.addEventListener('controllerchange', () => {
    if (hadController) notify();
    hadController = true;
  });
}
