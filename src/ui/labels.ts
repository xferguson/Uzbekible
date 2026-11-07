import { latnToCyrl, scriptMeta } from '@core/text';

/** Uzbek script a label is shown in. */
export type Script = 'latn' | 'cyrl';

/** UI labels are written once in Latin; Cyrillic is derived through `core/text`. */
export function label(script: Script, latn: string): string {
  return script === 'cyrl' ? latnToCyrl(latn) : latn;
}

/** `lang`/`dir` attributes for text in the given Uzbek script. */
export function langProps(script: Script): { lang: string; dir: 'ltr' | 'rtl' } {
  const meta = scriptMeta(script === 'cyrl' ? 'uz-Cyrl' : 'uz-Latn');
  return { lang: meta.bcp47, dir: meta.dir };
}
