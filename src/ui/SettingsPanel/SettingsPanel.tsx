import { useState } from 'react';
import { type SourceLang, type UzScript } from '@core/text';
import { SourceText } from '../text';
import { label, langProps, type Script } from '../labels';
import styles from './SettingsPanel.module.css';

type Theme = 'system' | 'light' | 'dark';

export interface SettingsPanelProps {
  languages: readonly SourceLang[];
  script: UzScript;
  theme: Theme;
  onToggleLanguage: (lang: SourceLang) => void;
  onScript: (script: UzScript) => void;
  onTheme: (theme: Theme) => void;
  onExport: (format: 'csv' | 'json') => void;
  onReset: () => void;
}

/** Each source language is named in its own script. */
const LANGUAGES: [SourceLang, string][] = [
  ['tr', 'Türkçe'],
  ['ru', 'Русский'],
  ['fa', 'فارسی'],
  ['ar', 'العربية'],
];
const THEMES: [Theme, string][] = [
  ['system', 'Tizim'],
  ['light', 'Yorugʻ'],
  ['dark', 'Qorongʻi'],
];

export function SettingsPanel(p: SettingsPanelProps) {
  const s: Script = p.script === 'uz-Cyrl' ? 'cyrl' : 'latn';
  const t = (latn: string) => label(s, latn);
  const [confirming, setConfirming] = useState(false);
  const onlyOne = p.languages.length === 1;

  return (
    <section className={styles.panel} aria-labelledby="settings-title" {...langProps(s)}>
      <h2 id="settings-title">{t('Sozlamalar')}</h2>

      <fieldset className={styles.group}>
        <legend>{t('Manba tillar')}</legend>
        {LANGUAGES.map(([lang, name]) => {
          const on = p.languages.includes(lang);
          return (
            <label key={lang} className={styles.row}>
              <input
                type="checkbox"
                checked={on}
                disabled={on && onlyOne}
                onChange={() => p.onToggleLanguage(lang)}
                aria-label={name}
              />
              <SourceText lang={lang} text={name} />
            </label>
          );
        })}
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t('Yozuv')}</legend>
        <label className={styles.row}>
          <input
            type="radio"
            name="script"
            checked={p.script === 'uz-Latn'}
            onChange={() => p.onScript('uz-Latn')}
          />
          {t('Lotin')}
        </label>
        <label className={styles.row}>
          <input
            type="radio"
            name="script"
            checked={p.script === 'uz-Cyrl'}
            onChange={() => p.onScript('uz-Cyrl')}
          />
          {t('Kirill')} ({t('qiyin rejim')})
        </label>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t('Mavzu')}</legend>
        {THEMES.map(([value, name]) => (
          <label key={value} className={styles.row}>
            <input
              type="radio"
              name="theme"
              checked={p.theme === value}
              onChange={() => p.onTheme(value)}
            />
            {t(name)}
          </label>
        ))}
      </fieldset>

      <div className={styles.group}>
        <h3>{t('Oʻrganish jurnali')}</h3>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={() => p.onExport('csv')}>
            CSV
          </button>
          <button type="button" className={styles.button} onClick={() => p.onExport('json')}>
            JSON
          </button>
        </div>
      </div>

      <div className={styles.group}>
        {confirming ? (
          <div role="alertdialog" aria-label={t('Tozalash')} className={styles.confirm}>
            <p>{t('Barcha natijalar oʻchadi. Ishonchingiz komilmi?')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.danger}
                onClick={() => {
                  setConfirming(false);
                  p.onReset();
                }}
              >
                {t('Ha, oʻchirish')}
              </button>
              <button type="button" className={styles.button} onClick={() => setConfirming(false)}>
                {t('Bekor qilish')}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
            {t('Natijalarni tozalash')}
          </button>
        )}
      </div>
    </section>
  );
}
