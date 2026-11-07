import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createFakeClock } from '@core/clock';
import { createMemoryBackend } from '@core/storage';
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
