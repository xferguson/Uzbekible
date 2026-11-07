import { scriptMeta, type SourceLang } from '@core/text';

export interface SourceTextProps {
  lang: SourceLang;
  text: string;
  className?: string;
}

/** Text in a source language's native script (RTL for Persian/Arabic). */
export function SourceText({ lang, text, className }: SourceTextProps) {
  const meta = scriptMeta(lang);
  return (
    <span lang={meta.bcp47} dir={meta.dir} style={{ fontFamily: meta.fontStack }} className={className}>
      {text}
    </span>
  );
}
