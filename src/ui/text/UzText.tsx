import { latnToCyrl, scriptMeta, type UzScript } from '@core/text';
import { useUzScript } from './ScriptContext';

export interface UzTextProps {
  latn: string;
  /** Stored Cyrillic spelling; transliterated from `latn` when absent. */
  cyrl?: string | undefined;
  /** Overrides the player's script setting. */
  script?: UzScript;
  className?: string;
}

/** Uzbek text in the player's chosen script, with correct lang/dir/font. */
export function UzText({ latn, cyrl, script, className }: UzTextProps) {
  const setting = useUzScript();
  const active = script ?? setting;
  const meta = scriptMeta(active);
  const text = active === 'uz-Cyrl' ? (cyrl ?? latnToCyrl(latn)) : latn;
  return (
    <span
      lang={meta.bcp47}
      dir={meta.dir}
      style={{ fontFamily: meta.fontStack }}
      className={className}
    >
      {text}
    </span>
  );
}
