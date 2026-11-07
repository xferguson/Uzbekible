import { act, render, screen } from '@testing-library/react';
import { UpdateToast } from './UpdateToast';

describe('<UpdateToast />', () => {
  it('appears after the service worker is replaced, and can be dismissed', async () => {
    let handler: () => void = () => {};
    const sw = {
      controller: {},
      addEventListener: (_: string, h: () => void) => (handler = h),
    } as unknown as ServiceWorkerContainer;
    render(<UpdateToast sw={sw} />);
    expect(screen.queryByRole('status')).toBeNull();
    act(() => handler());
    expect(screen.getByRole('status')).toHaveTextContent('new version');
    act(() => screen.getByRole('button', { name: 'Dismiss' }).click());
    expect(screen.queryByRole('status')).toBeNull();
  });
});
