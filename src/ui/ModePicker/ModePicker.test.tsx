import { fireEvent, render, screen } from '@testing-library/react';
import { ModePicker } from './ModePicker';

const modes = [
  { id: 'oson', name: { uzLatn: 'Oson', uzCyrl: 'Осон' } },
  { id: 'qiyin', name: { uzLatn: 'Qiyin', uzCyrl: 'Қийин' } },
];

describe('<ModePicker />', () => {
  it('shows each mode name in the player script and marks the chosen one', () => {
    const { rerender } = render(
      <ModePicker modes={modes} value="qiyin" script="latn" onChange={() => {}} />,
    );
    expect(screen.getByRole('radio', { name: 'Qiyin' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Oson' })).not.toBeChecked();
    rerender(<ModePicker modes={modes} value="qiyin" script="cyrl" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Қийин' })).toBeChecked();
  });

  it('reports the picked mode id', () => {
    const onChange = vi.fn();
    render(<ModePicker modes={modes} value="oson" script="latn" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Qiyin' }));
    expect(onChange).toHaveBeenCalledWith('qiyin');
  });
});
