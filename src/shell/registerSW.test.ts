import { watchForUpdate } from './registerSW';

function fakeSw(controller: unknown) {
  let handler: () => void = () => {};
  return {
    sw: {
      controller,
      addEventListener: (_: string, h: () => void) => {
        handler = h;
      },
    } as unknown as ServiceWorkerContainer,
    fire: () => handler(),
  };
}

describe('watchForUpdate', () => {
  it('notifies when a new worker takes over an already-controlled page', () => {
    const notify = vi.fn();
    const { sw, fire } = fakeSw({});
    watchForUpdate({ notify, sw });
    fire();
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('does not notify on first install', () => {
    const notify = vi.fn();
    const { sw, fire } = fakeSw(null);
    watchForUpdate({ notify, sw });
    fire();
    expect(notify).not.toHaveBeenCalled();
    fire();
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('is a no-op without service worker support', () => {
    expect(() => watchForUpdate({ notify: vi.fn() })).not.toThrow();
  });
});
