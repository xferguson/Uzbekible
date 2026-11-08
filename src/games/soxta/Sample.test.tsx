import { render, screen } from '@testing-library/react';
import { Sample } from './Sample.tsx';

describe('Soxta ready-card sample', () => {
  it('shows the Uzbek word in the player script beside its clue and the Turkish false friend', () => {
    const { rerender } = render(<Sample script="latn" />);
    const sample = screen.getByTestId('ready-sample');
    expect(sample).toHaveTextContent('UZtun');
    expect(sample).toHaveTextContent('night');
    expect(sample).toHaveTextContent('TRdün');
    rerender(<Sample script="cyrl" />);
    expect(screen.getByTestId('ready-sample')).toHaveTextContent('UZтун');
  });
});
