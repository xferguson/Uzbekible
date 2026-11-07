import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelMap, chapterOf, levelState, type ChapterInfo, type MapProgress } from './index';

const CHAPTERS: ChapterInfo[] = [
  { id: 'gumbaz', name: 'Gumbaz', levels: 15 },
  { id: 'minora', name: 'Minora', levels: 15 },
  { id: 'ayvon', name: 'Ayvon', levels: 10 },
];
const progress: MapProgress = {
  unlocked: 7,
  best: { 5: { score: 1840, stars: 2 }, 3: { score: 900, stars: 3 }, 6: { score: 100, stars: 0 } },
};

describe('levelState / chapterOf', () => {
  it('derives state from stored progress', () => {
    expect(levelState(3, progress)).toBe('cleared');
    expect(levelState(7, progress)).toBe('current');
    expect(levelState(8, progress)).toBe('locked');
    expect(levelState(1, { unlocked: 1, best: {} })).toBe('current');
  });
  it('maps levels to chapters from config', () => {
    expect(chapterOf(1, CHAPTERS)).toBe(0);
    expect(chapterOf(15, CHAPTERS)).toBe(0);
    expect(chapterOf(16, CHAPTERS)).toBe(1);
    expect(chapterOf(40, CHAPTERS)).toBe(2);
    expect(chapterOf(999, CHAPTERS)).toBe(2);
  });
});

describe('LevelMap', () => {
  it('shows the chapter of the current level with screen-reader labels', () => {
    render(<LevelMap chapters={CHAPTERS} progress={progress} onSelect={() => {}} />);
    expect(
      screen.getByRole('button', { name: '5-daraja, 2 yulduz, eng yaxshi 1840' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: '7-daraja, joriy' })).toBeEnabled();
    expect(screen.getAllByRole('button', { name: /^\d+-daraja/ })).toHaveLength(15);
  });

  it('selects unlocked levels; locked cells are not activatable', async () => {
    const onSelect = vi.fn();
    render(<LevelMap chapters={CHAPTERS} progress={progress} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /^5-daraja/ }));
    await userEvent.click(screen.getByRole('button', { name: /^7-daraja/ }));
    expect(onSelect.mock.calls).toEqual([[5], [7]]);
    const locked = screen.getByRole('button', { name: '8-daraja, qulflangan' });
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(locked);
    locked.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('is keyboard navigable', async () => {
    const onSelect = vi.fn();
    render(<LevelMap chapters={CHAPTERS} progress={progress} onSelect={onSelect} />);
    screen.getByRole('button', { name: /^5-daraja/ }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(5);
    await userEvent.tab();
    expect(document.activeElement).toHaveAccessibleName(/^6-daraja/);
  });

  it('chapter navigation switches the facade; counts come from config', async () => {
    render(<LevelMap chapters={CHAPTERS} progress={progress} onSelect={() => {}} />);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getAllByRole('button')).toHaveLength(3);
    await userEvent.click(within(nav).getByRole('button', { name: /Ayvon/ }));
    expect(screen.getAllByRole('button', { name: /^\d+-daraja/ })).toHaveLength(10);
    expect(screen.getByRole('button', { name: '31-daraja, qulflangan' })).toBeInTheDocument();
  });

  it('marks stars with pips, not colour alone', () => {
    render(<LevelMap chapters={CHAPTERS} progress={progress} onSelect={() => {}} />);
    const cell = screen.getByRole('button', { name: /^3-daraja/ });
    expect(cell).toHaveAttribute('data-state', 'cleared');
    expect(cell).toHaveAttribute('data-stars', '3');
    expect(cell.querySelectorAll('[data-pip]')).toHaveLength(3);
  });

  it('renders Cyrillic when the script is cyrl', () => {
    render(<LevelMap chapters={CHAPTERS} progress={progress} script="cyrl" onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /^5-даража/ })).toBeInTheDocument();
  });
});
