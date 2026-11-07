// Unit tests for the C3 loan-partner helpers (run by Vitest: npm test), plus a data check over content/items.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  LOAN_LANGS,
  parseLoanRows,
  foldArabic,
  foldRussian,
  scriptErrors,
  originSupports,
  loanConfidence,
  loanItemSources,
} from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('parseLoanRows reads rank, lemma and one partner per language', () => {
  const rows = parseLoanRows(
    'rank\tlemma\tru\tfa\tar\n81\tkitob\t\t\tكتاب\n120\tmashina\tмашина\t\t\n',
  );
  assert.deepEqual(rows, [
    { rank: 81, lemma: 'kitob', ru: [], fa: [], ar: ['كتاب'] },
    { rank: 120, lemma: 'mashina', ru: ['машина'], fa: [], ar: [] },
  ]);
});

test('parseLoanRows allows several partners joined by |', () => {
  const [r] = parseLoanRows('rank\tlemma\tru\tfa\tar\n1\tx\t\tأ|ب\t\n');
  assert.deepEqual(r.fa, ['أ', 'ب']);
});

test('parseLoanRows rejects bad rows', () => {
  assert.throws(() => parseLoanRows('rank\tlemma\tru\tfa\tar\nx\tkitob\t\t\t\n'), /rank/);
  assert.throws(() => parseLoanRows('rank\tlemma\tru\tfa\tar\n1\tkitob\n'), /columns/);
});

test('foldArabic drops vowel marks and unifies letter variants', () => {
  assert.equal(foldArabic('كِتَاب'), foldArabic('کتاب'));
  assert.equal(foldArabic('إِنْسَان'), foldArabic('انسان'));
  assert.equal(foldArabic('دَوْلَة'), foldArabic('دولة'));
  assert.equal(foldArabic('دنیا'), foldArabic('دنيا'));
});

test('foldRussian lowercases and unifies ё', () => {
  assert.equal(foldRussian('Самолёт'), foldRussian('самолет'));
});

test('scriptErrors accepts native scripts and rejects the wrong one', () => {
  assert.deepEqual(scriptErrors('ru', 'машина'), []);
  assert.deepEqual(scriptErrors('ar', 'كتاب'), []);
  assert.deepEqual(scriptErrors('fa', 'چای'), []);
  assert.equal(scriptErrors('ru', 'mashina').length, 1);
  assert.equal(scriptErrors('ar', 'машина').length, 1);
  assert.equal(scriptErrors('fa', 'dost').length, 1);
  // Persian-only letters are not Arabic spelling
  assert.equal(scriptErrors('ar', 'چای').length, 1);
});

test('originSupports checks the ancestor chain for the claimed language', () => {
  assert.equal(originSupports('ar', ['ar', 'sem-pro']), true);
  assert.equal(originSupports('fa', ['pal', 'fa']), true);
  assert.equal(originSupports('ru', ['ru']), true);
  assert.equal(originSupports('ru', ['fa']), false);
  assert.equal(originSupports('ar', ['otk']), false);
});

test('loanConfidence counts independent etymology entries', () => {
  assert.equal(loanConfidence({ uzOrigin: true, trOrigin: true }), 'high');
  assert.equal(loanConfidence({ uzOrigin: true, trOrigin: false }), 'medium');
  assert.equal(loanConfidence({ uzOrigin: false, trOrigin: true }), 'medium');
  assert.equal(loanConfidence({ uzOrigin: false, trOrigin: false }), 'low');
});

test('loanItemSources builds one source per partner with relation, confidence and ref', () => {
  const row = { rank: 81, lemma: 'kitob', ru: [], fa: [], ar: ['كتاب'] };
  const ev = { uz: { ar: true }, tr: { ar: true }, trText: 'kitap' };
  const [s] = loanItemSources(row, ev);
  assert.deepEqual(s, {
    lang: 'ar',
    text: 'كتاب',
    relation: 'arabic-loan',
    confidence: 'high',
    ref: 'wiktionary:kitob; wiktionary:kitap',
  });
  const [t] = loanItemSources(
    { rank: 2, lemma: 'u', ru: ['x'], fa: [], ar: [] },
    { uz: {}, tr: {} },
  );
  assert.equal(t.relation, 'russian-loan');
  assert.equal(t.confidence, 'low');
  assert.equal(t.ref, 'curator:C3');
});

test('LOAN_LANGS map each language to its relation', () => {
  assert.deepEqual(LOAN_LANGS, { ru: 'russian-loan', fa: 'persian-loan', ar: 'arabic-loan' });
});

function loadItems() {
  const dir = join(here, '../../items');
  return readdirSync(dir)
    .filter((f) => /^freq-.*\.yaml$/.test(f))
    .sort()
    .flatMap((f) => parseYaml(readFileSync(join(dir, f), 'utf8')));
}

test('content/items carry valid ru/fa/ar loan sources', () => {
  const items = loadItems();
  const loans = items.flatMap((i) =>
    i.sources.filter((s) => s.lang in LOAN_LANGS).map((s) => ({ i, s })),
  );
  assert.ok(loans.length >= 400, `only ${loans.length} loan sources`);
  for (const { i, s } of loans) {
    assert.deepEqual(scriptErrors(s.lang, s.text), [], `${i.id} ${s.lang}`);
    assert.equal(s.relation, LOAN_LANGS[s.lang], `${i.id} ${s.lang} relation`);
    assert.ok(['high', 'medium', 'low'].includes(s.confidence), `${i.id} confidence`);
    assert.ok(typeof s.ref === 'string' && s.ref.trim(), `${i.id} ref`);
    if (s.confidence !== 'low') assert.ok(!s.ref.startsWith('curator'), `${i.id} ref`);
  }
});

test('shared-arabic and shared-persian Turkish partners get an Arabic or Persian partner', () => {
  const items = loadItems();
  const missing = [];
  for (const i of items.filter((x) => x.freqRank <= 1000)) {
    const need = new Set(
      i.sources
        .filter(
          (s) =>
            s.lang === 'tr' && (s.relation === 'shared-arabic' || s.relation === 'shared-persian'),
        )
        .map((s) => (s.relation === 'shared-arabic' ? 'ar' : 'fa')),
    );
    for (const l of need) {
      // Some shared-arabic words are Persian-mediated and carry a fa partner instead (and vice versa).
      if (!i.sources.some((s) => s.lang === 'ar' || s.lang === 'fa')) missing.push(`${i.id}:${l}`);
    }
  }
  assert.ok(
    missing.length <= 40,
    `${missing.length} shared loans without a partner: ${missing.join(' ')}`,
  );
});
