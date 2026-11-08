import { render, screen } from '@testing-library/react';
import { SoxtaPreview } from './SoxtaPreview';
import { isSoxtaPreviewPath } from './route';

describe('Soxta dev preview (temporary, removed by J6)', () => {
  it('matches /dev/soxta under any base', () => {
    expect(isSoxtaPreviewPath('/dev/soxta')).toBe(true);
    expect(isSoxtaPreviewPath('/Uzbekible/dev/soxta/')).toBe(true);
    expect(isSoxtaPreviewPath('/Uzbekible/')).toBe(false);
  });

  it('idle shows a fresh card with no reveal', () => {
    render(<SoxtaPreview search="?state=idle" />);
    expect(screen.getByTestId('clue')).toBeInTheDocument();
    expect(screen.queryByTestId('reveal')).toBeNull();
  });

  it.each(['wrong', 'timeout'] as const)('%s shows the reveal and a lost life', (state) => {
    render(<SoxtaPreview search={`?state=${state}`} />);
    expect(screen.getByTestId('reveal')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /2\/3/ })).toBeInTheDocument();
  });

  it('correct glazes the answered tile', () => {
    render(<SoxtaPreview search="?state=correct" />);
    expect(screen.getByTestId('soxta-board')).toHaveAttribute('data-feedback', 'correct');
  });

  it('cyrl shows the Cyrillic Uzbek word', () => {
    render(<SoxtaPreview search="?state=idle&script=cyrl" />);
    expect(screen.getByTestId('soxta-board').textContent).toMatch(/[а-яқҳў]/);
  });
});
