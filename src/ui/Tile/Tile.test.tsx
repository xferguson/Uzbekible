import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tile, type TileState } from './index';

const STATES: TileState[] = ['idle', 'selected', 'matched', 'wrong', 'cracked', 'disabled'];

describe('Tile', () => {
  it.each(STATES)('exposes state %s', (state) => {
    render(<Tile state={state} label="gʻisht" />);
    const tile = screen.getByRole('button', { name: /gʻisht/ });
    expect(tile).toHaveAttribute('data-state', state);
    if (state === 'idle') expect(tile).not.toHaveAccessibleDescription();
    else expect(tile).toHaveAccessibleDescription(/.+/);
    expect(tile).toHaveAttribute('aria-pressed', String(state === 'selected'));
  });

  it('is not colour-only: non-idle states render a glyph marker', () => {
    const { rerender } = render(<Tile state="idle" label="a" />);
    expect(document.querySelector('[data-marker]')).toBeNull();
    for (const state of STATES.filter((s) => s !== 'idle')) {
      rerender(<Tile state={state} label="a" />);
      expect(document.querySelector('[data-marker]'), state).not.toBeNull();
    }
  });

  it('disabled is aria-disabled and does not fire', async () => {
    const onSelect = vi.fn();
    render(<Tile state="disabled" label="a" onSelect={onSelect} />);
    const tile = screen.getByRole('button');
    expect(tile).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(tile);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('matched tiles do not fire either', async () => {
    const onSelect = vi.fn();
    render(<Tile state="matched" label="a" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('click, Enter and Space select', async () => {
    const onSelect = vi.fn();
    render(<Tile label="a" onSelect={onSelect} />);
    const tile = screen.getByRole('button');
    await userEvent.click(tile);
    tile.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('supports rect and hex shapes', () => {
    const { rerender } = render(<Tile label="a" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-shape', 'rect');
    rerender(<Tile label="a" shape="hex" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-shape', 'hex');
  });

  it('renders children in place of label text but keeps the accessible name', () => {
    render(
      <Tile label="shahar">
        <span>★</span>
      </Tile>,
    );
    expect(screen.getByRole('button', { name: /shahar/ })).toBeInTheDocument();
  });

  it('passes long-press handlers through', () => {
    const onPointerDown = vi.fn();
    render(<Tile label="a" pressHandlers={{ onPointerDown }} />);
    screen.getByRole('button').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(onPointerDown).toHaveBeenCalled();
  });
});

describe('Tile onKeyDown', () => {
  it('passes key presses to the caller', async () => {
    const onKeyDown = vi.fn();
    render(<Tile label="a" onKeyDown={onKeyDown} />);
    screen.getByRole('button').focus();
    await userEvent.keyboard('h');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
