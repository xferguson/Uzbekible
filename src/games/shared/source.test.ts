import { describe, expect, it } from 'vitest';
import { makeItem } from '@core/content/fixtures.ts';
import type { SourceForm } from '@core/content/index.ts';
import { createRng } from '@core/random/index.ts';
import type { SourceLang } from '@core/text/index.ts';
import { chooseSource } from './source.ts';

const form = (lang: SourceLang, text: string, over: Partial<SourceForm> = {}): SourceForm => ({
  lang,
  text,
  relation: 'turkic-cognate',
  confidence: 'high',
  ref: 'x',
  ...over,
});

describe('chooseSource', () => {
  const item = makeItem({ sources: [form('ru', 'глаз'), form('tr', 'göz'), form('fa', 'چشم')] });

  it('prefers Turkish when enabled', () => {
    expect(chooseSource(item, new Set<SourceLang>(['tr', 'ru']), createRng(1)).text).toBe('göz');
  });
  it('otherwise picks among the enabled languages, deterministically', () => {
    const langs = new Set<SourceLang>(['ru', 'fa']);
    expect(chooseSource(item, langs, createRng(3))).toEqual(
      chooseSource(item, langs, createRng(3)),
    );
    expect(chooseSource(item, new Set<SourceLang>(['fa']), createRng(1)).text).toBe('چشم');
  });
  it('prefers the more confident form and skips false friends', () => {
    const it2 = makeItem({
      sources: [
        form('tr', 'a', { confidence: 'low' }),
        form('tr', 'b', { confidence: 'high' }),
        form('tr', 'c', { relation: 'false-friend' }),
      ],
    });
    expect(chooseSource(it2, new Set<SourceLang>(['tr']), createRng(1)).text).toBe('b');
  });
  it('honours the accept filter', () => {
    const it2 = makeItem({ sources: [form('tr', 'uzun söz'), form('tr', 'söz')] });
    const pick = chooseSource(
      it2,
      new Set<SourceLang>(['tr']),
      createRng(1),
      (s) => !s.text.includes(' '),
    );
    expect(pick.text).toBe('söz');
  });
});
