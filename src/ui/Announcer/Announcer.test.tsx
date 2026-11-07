import { act, render, screen } from '@testing-library/react';
import { Announcer, AnnouncerProvider, useAnnounce } from './index';

function Button() {
  const announce = useAnnounce();
  return <button onClick={() => announce('Juft topildi')}>go</button>;
}

describe('Announcer', () => {
  it('renders a polite atomic live region', () => {
    render(<Announcer message="" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('shows the message', () => {
    render(<Announcer message="Hello" />);
    expect(screen.getByRole('status')).toHaveTextContent('Hello');
  });

  it('provider relays announcements from descendants', () => {
    render(
      <AnnouncerProvider>
        <Button />
      </AnnouncerProvider>,
    );
    act(() => screen.getByText('go').click());
    expect(screen.getByRole('status')).toHaveTextContent('Juft topildi');
  });

  it('useAnnounce is a no-op without a provider', () => {
    render(<Button />);
    expect(() => act(() => screen.getByText('go').click())).not.toThrow();
  });
});
