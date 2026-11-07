import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel, type SettingsPanelProps } from './index';

const base = (over: Partial<SettingsPanelProps> = {}): SettingsPanelProps => ({
  languages: ['tr', 'ru', 'fa', 'ar'],
  script: 'uz-Latn',
  theme: 'system',
  onToggleLanguage: vi.fn(),
  onScript: vi.fn(),
  onTheme: vi.fn(),
  onExport: vi.fn(),
  onReset: vi.fn(),
  ...over,
});

describe('SettingsPanel', () => {
  it('shows each source language in its own script with RTL for fa/ar', () => {
    render(<SettingsPanel {...base()} />);
    expect(screen.getByLabelText('Türkçe')).toBeChecked();
    expect(screen.getByLabelText('فارسی').closest('label')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toHaveAttribute('dir', 'rtl');
  });

  it('emits language toggles', async () => {
    const p = base();
    render(<SettingsPanel {...p} />);
    await userEvent.click(screen.getByLabelText('Русский'));
    expect(p.onToggleLanguage).toHaveBeenCalledWith('ru');
  });

  it('disables the only remaining language', () => {
    render(<SettingsPanel {...base({ languages: ['tr'] })} />);
    expect(screen.getByLabelText('Türkçe')).toBeDisabled();
    expect(screen.getByLabelText('Русский')).toBeEnabled();
  });

  it('labels Cyrillic as hard mode and emits script choice', async () => {
    const p = base();
    render(<SettingsPanel {...p} />);
    const cyrl = screen.getByRole('radio', { name: /Кирилл|Kirill/i });
    expect(cyrl).toHaveAccessibleName(/qiyin|қийин/i);
    await userEvent.click(cyrl);
    expect(p.onScript).toHaveBeenCalledWith('uz-Cyrl');
  });

  it('emits theme choice', async () => {
    const p = base();
    render(<SettingsPanel {...p} />);
    await userEvent.click(screen.getByRole('radio', { name: /qorong/i }));
    expect(p.onTheme).toHaveBeenCalledWith('dark');
  });

  it('exports CSV and JSON', async () => {
    const p = base();
    render(<SettingsPanel {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /CSV/ }));
    await userEvent.click(screen.getByRole('button', { name: /JSON/ }));
    expect(p.onExport).toHaveBeenNthCalledWith(1, 'csv');
    expect(p.onExport).toHaveBeenNthCalledWith(2, 'json');
  });

  it('resets only after confirmation', async () => {
    const p = base();
    render(<SettingsPanel {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /tozalash/i }));
    expect(p.onReset).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /bekor/i }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tozalash/i }));
    await userEvent.click(screen.getByRole('button', { name: /ha, /i }));
    expect(p.onReset).toHaveBeenCalledOnce();
  });

  it('renders UI labels in Cyrillic when the script is Cyrillic', () => {
    render(<SettingsPanel {...base({ script: 'uz-Cyrl' })} />);
    expect(screen.getByRole('heading', { name: /Созлама/ })).toBeInTheDocument();
  });
});
