import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createFakeClock } from '@core/clock';
import { createMemoryBackend } from '@core/storage';
import { GAMES } from '@games/registry';
import { getGame } from '@games/registry';
import { registerJuft } from '@games/juft/definition';
import { loadItems } from '@core/content';
import { createProgressStore } from './progress';
import { App } from './App';

const pack = JSON.parse(readFileSync('public/content/items.v1.json', 'utf8'));

function setup() {
  const clock = createFakeClock(1_000);
  const backend = createMemoryBackend();
  render(
    <App loadPack={() => Promise.resolve(pack)} clock={clock} backend={backend} countdownMs={0} />,
  );
  return { clock };
}

describe('<App />', () => {
  it('shows the Uzbekible title', () => {
    render(<App loadPack={() => new Promise(() => {})} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeInTheDocument();
  });

  it('draws the girih lattice behind every screen as a decorative, non-interactive layer', async () => {
    const { container } = render(<App loadPack={() => new Promise(() => {})} />);
    const layer = container.querySelector('[data-testid="app-bg"]')!;
    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.querySelector('pattern')).not.toBeNull();
    // It sits before the page content so the content paints over it.
    expect(layer.nextElementSibling?.tagName).toBe('MAIN');
  });

  it('survives a pack that fails to load', async () => {
    render(<App loadPack={() => Promise.reject(new Error('offline'))} />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('lists Juft from the registry and plays level 1 from home through the map to the results', async () => {
    const { clock } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Juft' }));
    // Level map: level 1 is playable, level 2 is locked.
    expect(screen.getByRole('button', { name: /^2-daraja, qulflangan/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: /^1-daraja, joriy/ }));
    await act(async () => {
      clock.advance(10);
    });
    // One pair: select the only left tile, then the only right tile.
    const left = document.querySelector<HTMLElement>('[data-testid="col-left"] button')!;
    const right = document.querySelector<HTMLElement>('[data-testid="col-right"] button')!;
    fireEvent.click(left);
    fireEvent.click(right);
    expect(screen.getByRole('img', { name: /\/3/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xarita' }));
    expect(screen.getByRole('button', { name: /^2-daraja, joriy/ })).toBeInTheDocument();
  });

  it('opens settings and switches the Uzbek script', async () => {
    setup();
    await screen.findByRole('button', { name: 'Juft' });
    fireEvent.click(screen.getByRole('button', { name: 'Sozlamalar' }));
    fireEvent.click(screen.getByRole('radio', { name: /^Kirill/ }));
    fireEvent.click(screen.getByRole('button', { name: /Орқага|Ortga/i }));
    expect(await screen.findByRole('button', { name: 'Жуфт' })).toBeInTheDocument();
  });

  it('offers a way out of every screen: back one step, or straight home from a level', async () => {
    const { clock } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Juft' }));
    // Map: back goes home.
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeInTheDocument();

    // Mid-level: back goes to the map, close goes home.
    fireEvent.click(screen.getByRole('button', { name: 'Juft' }));
    fireEvent.click(screen.getByRole('button', { name: /^1-daraja, joriy/ }));
    await act(async () => {
      clock.advance(10);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }));
    expect(screen.getByRole('button', { name: /^1-daraja, joriy/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^1-daraja, joriy/ }));
    await act(async () => {
      clock.advance(10);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Bosh sahifa' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeInTheDocument();

    // Results: the close button is still there.
    fireEvent.click(screen.getByRole('button', { name: 'Juft' }));
    fireEvent.click(screen.getByRole('button', { name: /^1-daraja, joriy/ }));
    await act(async () => {
      clock.advance(10);
    });
    fireEvent.click(document.querySelector<HTMLElement>('[data-testid="col-left"] button')!);
    fireEvent.click(document.querySelector<HTMLElement>('[data-testid="col-right"] button')!);
    expect(screen.getByRole('img', { name: /\/3/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bosh sahifa' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Uzbekible' })).toBeInTheDocument();
  });
});

describe('<App /> difficulty modes', () => {
  it('shows no picker for Juft (no modes)', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Juft' }));
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('shows a picker for a game with modes, remembers the choice and keeps progress per mode', async () => {
    const backend = createMemoryBackend();
    createProgressStore('juft', { backend }, 'qiyin').set({
      unlocked: 4,
      best: {},
    });
    if (!getGame('juft')) registerJuft(loadItems(pack));
    const juft = getGame('juft');
    const withModes = {
      ...juft!,
      modes: [
        { id: 'oson', name: { uzLatn: 'Oson', uzCyrl: 'Осон' } },
        { id: 'qiyin', name: { uzLatn: 'Qiyin', uzCyrl: 'Қийин' } },
      ],
    };
    GAMES.splice(GAMES.indexOf(juft!), 1, withModes);
    try {
      const view = render(
        <App loadPack={() => Promise.resolve(pack)} clock={createFakeClock(1)} backend={backend} />,
      );
      fireEvent.click(await screen.findByRole('button', { name: 'Juft' }));
      expect(screen.getByRole('radio', { name: 'Oson' })).toBeChecked();
      expect(screen.getByRole('button', { name: /^4-daraja/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      fireEvent.click(screen.getByRole('radio', { name: 'Qiyin' }));
      expect(screen.getByRole('button', { name: /^4-daraja, joriy/ })).toBeInTheDocument();
      view.unmount();
      render(
        <App loadPack={() => Promise.resolve(pack)} clock={createFakeClock(1)} backend={backend} />,
      );
      fireEvent.click(await screen.findByRole('button', { name: 'Juft' }));
      expect(screen.getByRole('radio', { name: 'Qiyin' })).toBeChecked();
    } finally {
      GAMES.splice(GAMES.indexOf(withModes), 1, juft!);
    }
  });
});
