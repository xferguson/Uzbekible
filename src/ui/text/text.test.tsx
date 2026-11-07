import { latnToCyrl } from '@core/text';
import { render, screen } from '@testing-library/react';
import { ScriptProvider, SourceText, UzText } from './index';

describe('UzText', () => {
  it('shows Latin by default with lang and ltr', () => {
    render(<UzText latn="Oʻzbek" cyrl="Ўзбек" />);
    const el = screen.getByText('Oʻzbek');
    expect(el).toHaveAttribute('lang', 'uz-Latn');
    expect(el).toHaveAttribute('dir', 'ltr');
  });

  it('follows the script setting', () => {
    render(
      <ScriptProvider script="uz-Cyrl">
        <UzText latn="Oʻzbek" cyrl="Ўзбек" />
      </ScriptProvider>,
    );
    const el = screen.getByText('Ўзбек');
    expect(el).toHaveAttribute('lang', 'uz-Cyrl');
    expect(screen.queryByText('Oʻzbek')).toBeNull();
  });

  it('falls back to transliterating Latin when Cyrillic is missing', () => {
    render(
      <ScriptProvider script="uz-Cyrl">
        <UzText latn="shahar" />
      </ScriptProvider>,
    );
    expect(screen.getByText(latnToCyrl('shahar'))).toBeInTheDocument();
  });
});

describe('SourceText', () => {
  it.each([
    ['fa', 'rtl'],
    ['ar', 'rtl'],
    ['tr', 'ltr'],
    ['ru', 'ltr'],
  ] as const)('%s gets dir=%s', (lang, dir) => {
    render(<SourceText lang={lang} text="x" />);
    const el = screen.getByText('x');
    expect(el).toHaveAttribute('dir', dir);
    expect(el).toHaveAttribute('lang', lang);
  });
});
