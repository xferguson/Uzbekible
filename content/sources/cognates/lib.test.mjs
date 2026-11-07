// Unit tests for the C2 Turkish-partner helpers (run by Vitest: npm test).
// core/text (K1) and core/content (C5) are not on main yet, so the helpers under test are local; see README.md.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  lowerTr,
  trLetters,
  uzLetters,
  parseCurated,
  correspondences,
  etymClass,
  supportsRelation,
  confidenceFor,
  parseApertiumDix,
  trInfinitive,
  itemIds,
  validateItems,
  RELATIONS,
} from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('lowerTr handles dotted and dotless I', () => {
  assert.equal(lowerTr('İstanbul'), 'istanbul');
  assert.equal(lowerTr('IRMAK'), 'ırmak');
});

test('trLetters maps Turkish spelling to Uzbek-style letters and drops circumflexes', () => {
  assert.deepEqual(trLetters('şeç'), ['sh', 'e', 'ch']);
  assert.deepEqual(trLetters('cevap'), ['j', 'e', 'v', 'a', 'p']);
  assert.deepEqual(trLetters('hâlâ'), ['h', 'a', 'l', 'a']);
});

test('uzLetters keeps digraphs and apostrophe letters whole', () => {
  assert.deepEqual(uzLetters('shoʻgʻil'), ['sh', 'oʻ', 'gʻ', 'i', 'l']);
  assert.deepEqual(uzLetters('dengiz'), ['d', 'e', 'ng', 'i', 'z']);
  assert.deepEqual(uzLetters('maʼno'), ['m', 'a', 'ʼ', 'n', 'o']);
});

test('parseCurated reads rows, sources and relations', () => {
  const rows = parseCurated(
    'rank\tlemma\tglossEn\ttr\n1\tkoʻz\teye\tgöz:tc\n2\tjuda\tvery\t\n3\tpul\tmoney\tpul:ff|para:sp\n',
  );
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], {
    rank: 1,
    lemma: 'koʻz',
    glossEn: 'eye',
    tr: [{ text: 'göz', relation: 'turkic-cognate' }],
  });
  assert.deepEqual(rows[1].tr, []);
  assert.deepEqual(
    rows[2].tr.map((s) => s.relation),
    ['false-friend', 'shared-persian'],
  );
});

test('parseCurated rejects an unknown relation code', () => {
  assert.throws(() => parseCurated('rank\tlemma\tglossEn\ttr\n1\tkoʻz\teye\tgöz:xx\n'), /relation/);
});

const cases = [
  ['göz', 'koʻz', ['g>k', 'ö>oʻ']],
  ['gelmek', 'kelmoq', ['g>k', 'mak>moq']],
  ['kara', 'qora', ['a>o', 'k>q']],
  ['ev', 'uy', ['irregular']],
  ['dağ', 'togʻ', ['a>o', 'd>t', 'ğ>gʻ']],
  ['vermek', 'bermoq', ['mak>moq', 'v>b']],
  ['ben', 'men', ['b>m']],
  ['deniz', 'dengiz', ['n>ng']],
  ['kitap', 'kitob', ['a>o', 'p>b']],
  ['akıl', 'aql', ['epenthesis', 'k>q']],
  ['mana', 'maʼno', ['a>o', 'tutuq']],
  ['olmak', 'boʻlmoq', ['mak>moq', 'o>oʻ', '∅>b']],
  ['vurmak', 'urmoq', ['mak>moq', 'v>∅']],
  ['haber', 'xabar', ['e>a', 'h>x']],
  ['kız', 'qiz', ['k>q', 'ı>i']],
  ['üç', 'uch', ['ü>u']],
  ['bir', 'bir', []],
];
for (const [tr, uz, tags] of cases) {
  test(`correspondences ${tr} → ${uz}`, () => {
    assert.deepEqual(correspondences(tr, uz), tags);
  });
}

test('etymClass picks the first non-Turkic language in a chain, else Turkic', () => {
  assert.equal(etymClass(['ota', 'trk-pro']), 'turkic');
  assert.equal(etymClass(['ota', 'fa', 'ar']), 'persian');
  assert.equal(etymClass(['ar']), 'arabic');
  assert.equal(etymClass(['fr', 'la']), 'european');
  assert.equal(etymClass(['ota']), null);
  assert.equal(etymClass([]), null);
});

test('supportsRelation accepts a chain that passes through the relation class', () => {
  assert.equal(supportsRelation('turkic-cognate', ['ota', 'trk-pro']), true);
  assert.equal(supportsRelation('shared-arabic', ['ota', 'fa', 'ar']), true);
  assert.equal(supportsRelation('shared-persian', ['ar']), false);
  assert.equal(supportsRelation('turkic-cognate', ['ota', 'fa']), false);
  assert.equal(supportsRelation('other-loan', ['fr', 'la']), true);
});

test('confidenceFor: two sources high, one medium, none low; false friends never high', () => {
  assert.equal(confidenceFor('turkic-cognate', { meaning: true, origin: true }), 'high');
  assert.equal(confidenceFor('turkic-cognate', { meaning: true, origin: false }), 'medium');
  assert.equal(confidenceFor('shared-arabic', { meaning: false, origin: true }), 'medium');
  assert.equal(confidenceFor('shared-arabic', { meaning: false, origin: false }), 'low');
  // For a false friend the dictionary must NOT pair the two words (meanings differ).
  assert.equal(confidenceFor('false-friend', { meaning: false, otherMeaning: true, origin: true }), 'medium');
  assert.equal(confidenceFor('false-friend', { meaning: true, otherMeaning: true, origin: true }), 'low');
  assert.equal(confidenceFor('false-friend', { meaning: false, otherMeaning: false, origin: true }), 'low');
});

test('trInfinitive follows vowel harmony', () => {
  assert.equal(trInfinitive('gel'), 'gelmek');
  assert.equal(trInfinitive('al'), 'almak');
  assert.equal(trInfinitive('gör'), 'görmek');
});

test('parseApertiumDix maps Uzbek stems to Turkish words, verbs as infinitives', () => {
  const dix = [
    '<e>       <p><l>göz<s n="n"/></l>      <r>koʻz<s n="n"/></r></p></e>',
    '<e>       <p><l>gel<s n="v"/><s n="iv"/></l>  <r>kel<s n="v"/><s n="iv"/></r></p></e>',
    '<e>       <p><l>burada<s n="adv"/></l>  <r>bu<b/>yerda<s n="adv"/></r></p></e>',
  ].join('\n');
  const m = parseApertiumDix(dix);
  assert.deepEqual(m.get('koʻz'), [{ text: 'göz', verb: false }]);
  assert.deepEqual(m.get('kel'), [{ text: 'gelmek', verb: true }]);
  assert.deepEqual(m.get('bu yerda'), [{ text: 'burada', verb: false }]);
});

test('itemIds are ASCII kebab ids and disambiguate collisions by rank', () => {
  const ids = itemIds([
    { rank: 254, lemma: 'ot' },
    { rank: 505, lemma: 'oʻt' },
    { rank: 66, lemma: 'koʻz' },
    { rank: 323, lemma: 'yaʼni' },
  ]);
  assert.deepEqual(ids, ['uz-ot', 'uz-ot-505', 'uz-koz', 'uz-yani']);
});

const goodItem = () => ({
  id: 'uz-koz',
  uz: { latn: 'koʻz', cyrl: 'кўз' },
  freqRank: 66,
  form: 'lemma',
  pos: 'noun',
  glossEn: 'eye',
  sources: [
    {
      lang: 'tr',
      text: 'göz',
      relation: 'turkic-cognate',
      confidence: 'high',
      correspondence: ['g>k', 'ö>oʻ'],
      ref: 'apertium-tur-uzb:göz; wiktionary:koʻz',
    },
  ],
  tags: [],
});

test('validateItems accepts a well-formed item', () => {
  assert.deepEqual(validateItems([goodItem()]), []);
});

test('validateItems reports duplicate ids, bad enums, missing ref, wrong scripts, bad apostrophes', () => {
  const dup = [goodItem(), goodItem()];
  assert.match(validateItems(dup).join('\n'), /duplicate id uz-koz/);
  const bad = goodItem();
  bad.sources[0].relation = 'cousin';
  bad.sources[0].confidence = 'sure';
  bad.sources[0].ref = '';
  bad.sources[0].text = 'гёз';
  bad.uz.latn = "ko'z";
  bad.uz.cyrl = 'koz';
  const errs = validateItems([bad]).join('\n');
  for (const re of [/relation/, /confidence/, /ref/, /Turkish Latin/, /apostrophe/, /Cyrillic/]) {
    assert.match(errs, re);
  }
});

test('RELATIONS lists the schema relations used by C2', () => {
  for (const r of ['turkic-cognate', 'shared-arabic', 'shared-persian', 'other-loan', 'false-friend']) {
    assert.ok(RELATIONS.includes(r), r);
  }
});

// Data check (the task's "YAML lint" until C5's content:validate lands).
test('content/items/freq-*.yaml parse and validate, and cover ranks 1-1000 once', () => {
  const dir = join(here, '../../items');
  const files = readdirSync(dir).filter((f) => /^freq-\d{4}-\d{4}\.yaml$/.test(f));
  assert.equal(files.length, 10);
  const items = files.flatMap((f) => parseYaml(readFileSync(join(dir, f), 'utf8')));
  assert.deepEqual(validateItems(items), []);
  const ranks = items.map((i) => i.freqRank).sort((a, b) => a - b);
  assert.deepEqual(
    ranks,
    Array.from({ length: 1000 }, (_, i) => i + 1),
  );
});
