import { fireEvent, render, screen } from '@testing-library/react';
import { ScreenBar } from './ScreenBar';

describe('<ScreenBar />', () => {
  it('always offers a back button', () => {
    const onBack = vi.fn();
    render(<ScreenBar title="Juft" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Orqaga' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Juft' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bosh sahifa' })).not.toBeInTheDocument();
  });

  it('adds a close-to-home button when given one', () => {
    const onHome = vi.fn();
    render(<ScreenBar title="Juft" onBack={vi.fn()} onHome={onHome} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bosh sahifa' }));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('labels its buttons in Cyrillic', () => {
    render(<ScreenBar title="Жуфт" onBack={vi.fn()} onHome={vi.fn()} script="cyrl" />);
    expect(screen.getByRole('button', { name: 'Орқага' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Бош саҳифа' })).toBeInTheDocument();
  });
});
