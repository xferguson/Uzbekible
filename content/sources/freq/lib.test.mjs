// Unit tests for the C1 frequency-list helpers (run by Vitest: npm test).
// core/text (K1) is not on main yet, so the helpers under test are local; see README.md.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  foldApostrophes,
  tokenize,
  cyrlToLatn,
  latnToCyrl,
  parseAnalyses,
  chooseCandidate,
  citationForm,
  lemmaPriors,
  parseCsv,
  parseLemmaFixes,
  zipfPerMillion,
  mergeSources,
} from './lib.mjs';

const OKINA = 'ʻ'; // ʻ in oʻ, gʻ
const TUTUQ = 'ʼ'; // ʼ tutuq belgisi

test('foldApostrophes: every variant after o/g becomes U+02BB', () => {
  for (const v of ["'", '`', '‘', '’', 'ʻ', 'ʼ', '´']) {
    assert.equal(foldApostrophes(`ko${v}z`), `ko${OKINA}z`);
    assert.equal(foldApostrophes(`tog${v}`), `tog${OKINA}`);
    assert.equal(foldApostrophes(`O${v}zbek`), `O${OKINA}zbek`);
  }
});

test('foldApostrophes: other in-word apostrophes become the tutuq U+02BC', () => {
  assert.equal(foldApostrophes("ma'no"), `ma${TUTUQ}no`);
  assert.equal(foldApostrophes('ta’sir'), `ta${TUTUQ}sir`);
  assert.equal(foldApostrophes('sun`iy'), `sun${TUTUQ}iy`);
  assert.equal(foldApostrophes(`sun${OKINA}iy`), `sun${TUTUQ}iy`);
  assert.equal(foldApostrophes(`ko${OKINA}z`), `ko${OKINA}z`);
});

test('foldApostrophes: output is NFC', () => {
  assert.equal(foldApostrophes('é'), 'é');
});

test('tokenize: lowercases, folds apostrophes, splits punctuation and hyphens, drops digits', () => {
  const toks = tokenize("Bu O‘zbekiston, 7 da ota-onalar bo'ldi.");
  assert.deepEqual(
    toks.map((t) => t.form),
    ['bu', `o${OKINA}zbekiston`, 'da', 'ota', 'onalar', `bo${OKINA}ldi`],
  );
});

test('tokenize: records capitalisation and sentence-initial position', () => {
  const toks = tokenize('Men Tom bilan keldim');
  assert.deepEqual(
    toks.map((t) => [t.form, t.cap, t.initial]),
    [
      ['men', true, true],
      ['tom', true, false],
      ['bilan', false, false],
      ['keldim', false, false],
    ],
  );
});

test('tokenize: strips quote apostrophes at word edges and rejects non-Uzbek-Latin tokens', () => {
  assert.deepEqual(
    tokenize("'salom' дом café shahar").map((t) => t.form),
    ['salom', 'shahar'],
  );
});

test('cyrlToLatn: Uzbek-specific letters and digraphs', () => {
  assert.equal(cyrlToLatn('кўз'), `ko${OKINA}z`);
  assert.equal(cyrlToLatn('тоғ'), `tog${OKINA}`);
  assert.equal(cyrlToLatn('қиз'), 'qiz');
  assert.equal(cyrlToLatn('ҳам'), 'ham');
  assert.equal(cyrlToLatn('шаҳар'), 'shahar');
  assert.equal(cyrlToLatn('чой'), 'choy');
  assert.equal(cyrlToLatn('маъно'), `ma${TUTUQ}no`);
});

test('cyrlToLatn: е is ye word-initially and after vowels/ъ, e elsewhere; ё ю я', () => {
  assert.equal(cyrlToLatn('ер'), 'yer');
  assert.equal(cyrlToLatn('келди'), 'keldi');
  assert.equal(cyrlToLatn('оила'), 'oila');
  assert.equal(cyrlToLatn('ёки'), 'yoki');
  assert.equal(cyrlToLatn('юз'), 'yuz');
  assert.equal(cyrlToLatn('яхши'), 'yaxshi');
  assert.equal(cyrlToLatn('эди'), 'edi');
});

test('cyrlToLatn: ц is s word-initially and after consonants, ts after vowels', () => {
  assert.equal(cyrlToLatn('цирк'), 'sirk');
  assert.equal(cyrlToLatn('милиция'), 'militsiya');
});

test('latnToCyrl: digraphs, oʻ/gʻ, initial e → э, ye → е', () => {
  assert.equal(latnToCyrl(`ko${OKINA}z`), 'кўз');
  assert.equal(latnToCyrl(`tog${OKINA}`), 'тоғ');
  assert.equal(latnToCyrl('shahar'), 'шаҳар');
  assert.equal(latnToCyrl('choy'), 'чой');
  assert.equal(latnToCyrl('edi'), 'эди');
  assert.equal(latnToCyrl('keldi'), 'келди');
  assert.equal(latnToCyrl('yer'), 'ер');
  assert.equal(latnToCyrl('yoki'), 'ёки');
  assert.equal(latnToCyrl('yaxshi'), 'яхши');
  assert.equal(latnToCyrl(`ma${TUTUQ}no`), 'маъно');
  assert.equal(latnToCyrl('qiz'), 'қиз');
  assert.equal(latnToCyrl('xalq'), 'халқ');
});

test('latnToCyrl: y before oʻ is й, not ё (yoʻq, yoʻl)', () => {
  assert.equal(latnToCyrl(`yo${OKINA}q`), 'йўқ');
  assert.equal(latnToCyrl(`yo${OKINA}l`), 'йўл');
  assert.equal(latnToCyrl(`qiyo${OKINA}`), 'қийў');
});

test('latnToCyrl ∘ cyrlToLatn round-trips native words', () => {
  for (const w of ['кўз', 'тоғ', 'шаҳар', 'ер', 'ёки', 'эди', 'келди', 'оила', 'маъно', 'ҳаёт', 'юз', 'чиқмоқ', 'йўқ', 'йўл']) {
    assert.equal(latnToCyrl(cyrlToLatn(w)), w);
  }
});

test('parseAnalyses: groups hfst-lookup output, drops clitic tails and unknowns', () => {
  const out = [
    'keldi\tkel<v><iv><ifi><p3><sg>\t0.000000',
    'keldi\tkel<v><iv><ifi><p3><pl>\t0.000000',
    '',
    'uchun\tuchun<post>\t0.000000',
    'uchun\tuchun<v><iv><imp><p2><sg>\t0.000000',
    'mumkin\tmumkin<adj>+e<cop><aor><p3><sg>\t0.000000',
    '',
    'xyzq\txyzq+?\tinf',
  ].join('\n');
  const m = parseAnalyses(out);
  assert.deepEqual(m.get('keldi'), [{ stem: 'kel', tags: ['v', 'iv', 'ifi', 'p3', 'sg'] }, { stem: 'kel', tags: ['v', 'iv', 'ifi', 'p3', 'pl'] }]);
  assert.equal(m.get('uchun').length, 2);
  assert.deepEqual(m.get('mumkin'), [{ stem: 'mumkin', tags: ['adj'] }]);
  assert.deepEqual(m.get('xyzq'), []);
});

const A = (stem, ...tags) => ({ stem, tags });

test('chooseCandidate: inflected verb form → verb lemma', () => {
  assert.deepEqual(chooseCandidate('keldi', [A('kel', 'v', 'iv', 'ifi', 'p3', 'sg')]), { stem: 'kel', pos: 'verb' });
});

test('chooseCandidate: an uninflected closed-class reading beats a verb imperative', () => {
  assert.deepEqual(
    chooseCandidate('uchun', [A('uchun', 'post'), A('uchun', 'v', 'iv', 'imp', 'p2', 'sg')]),
    { stem: 'uchun', pos: 'adp' },
  );
});

test('chooseCandidate: whole-word readings beat segmentations into a shorter stem', () => {
  assert.deepEqual(
    chooseCandidate('endi', [A('en', 'v', 'iv', 'ifi', 'p3', 'sg'), A('endi', 'adv')]),
    { stem: 'endi', pos: 'adv' },
  );
  assert.deepEqual(
    chooseCandidate('ham', [A('ha', 'n', 'px1sg', 'nom'), A('ham', 'cnjcoo'), A('ham', 'n', 'nom')]),
    { stem: 'ham', pos: 'conj' },
  );
});

test('chooseCandidate: pronoun beats noun homograph; adjective beats noun', () => {
  assert.deepEqual(chooseCandidate('men', [A('men', 'n', 'nom'), A('men', 'prn', 'pers', 'p1', 'sg', 'nom')]), { stem: 'men', pos: 'pron' });
  assert.deepEqual(chooseCandidate('katta', [A('katta', 'n', 'nom'), A('katta', 'adj')]), { stem: 'katta', pos: 'adj' });
});

test('chooseCandidate: reviewed overrides win (the converb deb → verb de-)', () => {
  const overrides = new Map([['deb', { stem: 'de', pos: 'verb' }]]);
  const analyses = [A('de', 'v', 'tv', 'prc_perf'), A('deb', 'cnjsub')];
  assert.deepEqual(chooseCandidate('deb', analyses), { stem: 'deb', pos: 'conj' });
  assert.deepEqual(chooseCandidate('deb', analyses, { overrides }), { stem: 'de', pos: 'verb' });
  assert.equal(chooseCandidate('zzz', [], { overrides: new Map([['zzz', { stem: 'z', pos: 'noun' }]]) }), null);
});

test('chooseCandidate: numerals beat pronoun readings (ikki)', () => {
  assert.deepEqual(
    chooseCandidate('ikki', [A('ikki', 'n', 'nom'), A('ikki', 'num'), A('ikki', 'prn', 'qnt', 'nom')]),
    { stem: 'ikki', pos: 'num' },
  );
});

test('chooseCandidate: without a closed-class whole-word reading, the lemma with the larger prior wins', () => {
  const oldi = [A('ol', 'v', 'tv', 'ifi', 'p3', 'sg'), A('ol', 'vaux', 'ifi', 'p3', 'sg'), A('old', 'n', 'px3sp', 'nom'), A('oldi', 'adj')];
  const priors = new Map([['olmoq', 5000], ['old', 3], ['oldi', 400]]);
  assert.deepEqual(chooseCandidate('oldi', oldi, { priors }), { stem: 'ol', pos: 'verb' });
  // With no priors the whole-word reading is kept.
  assert.deepEqual(chooseCandidate('oldi', oldi), { stem: 'oldi', pos: 'adj' });
  const uning = [A('u', 'prn', 'pers', 'p3', 'sg', 'gen'), A('un', 'n', 'px2sg', 'nom'), A('uning', 'n', 'nom')];
  assert.deepEqual(chooseCandidate('uning', uning, { priors: new Map([['u', 9000], ['un', 50], ['uning', 1200]]) }), { stem: 'u', pos: 'pron' });
});

test('chooseCandidate: an inflected form prefers the noun reading, a bare form the adjective', () => {
  assert.deepEqual(chooseCandidate('kunlar', [A('kun', 'adj', 'subst', 'pl', 'nom'), A('kun', 'n', 'pl', 'nom')]), { stem: 'kun', pos: 'noun' });
  assert.deepEqual(chooseCandidate('kun', [A('kun', 'adj'), A('kun', 'n', 'nom')]), { stem: 'kun', pos: 'adj' });
});

test('lemmaPriors: splits each form\'s mass evenly across its candidate lemmas', () => {
  const analyses = new Map([
    ['oldi', [A('ol', 'v', 'tv', 'ifi', 'p3', 'sg'), A('oldi', 'adj'), A('oldi', 'n', 'nom')]],
    ['olib', [A('ol', 'v', 'tv', 'prc_perf')]],
    ['xyz', []],
  ]);
  const p = lemmaPriors(new Map([['oldi', 10], ['olib', 4], ['xyz', 7]]), analyses);
  assert.deepEqual([...p.entries()].sort(), [['oldi', 5], ['olmoq', 9]]);
});

test('chooseCandidate: copula forms map to edi / ekan / emas', () => {
  assert.deepEqual(chooseCandidate('edi', [A('e', 'cop', 'ifi', 'p3', 'sg')]), { stem: 'edi', pos: 'aux' });
  assert.deepEqual(chooseCandidate('edim', [A('e', 'cop', 'ifi', 'p1', 'sg')]), { stem: 'edi', pos: 'aux' });
  assert.deepEqual(chooseCandidate('ekan', [A('e', 'cop', 'aor', 'evid', 'p3', 'sg')]), { stem: 'ekan', pos: 'aux' });
  assert.deepEqual(
    chooseCandidate('emas', [A('e', 'cop', 'neg', 'aor', 'p3', 'sg'), A('emas', 'adj'), A('emas', 'adv')]),
    { stem: 'emas', pos: 'aux' },
  );
});

test('chooseCandidate: proper nouns, abbreviations and unknowns give null', () => {
  assert.equal(chooseCandidate('tom', [A('Tom', 'np', 'ant', 'm', 'nom')]), null);
  assert.equal(chooseCandidate('m', [A('m', 'abbr')]), null);
  assert.equal(chooseCandidate('xyzq', []), null);
});

test('chooseCandidate: abbreviation readings are ignored when a real reading exists', () => {
  assert.deepEqual(
    chooseCandidate('ming', [A('m', 'abbr', 'px2sg', 'nom'), A('mi', 'n', 'px2sg', 'nom'), A('ming', 'num')]),
    { stem: 'ming', pos: 'num' },
  );
});

test('citationForm: verbs take -moq, everything else is the stem', () => {
  assert.equal(citationForm({ stem: 'kel', pos: 'verb' }), 'kelmoq');
  assert.equal(citationForm({ stem: 'de', pos: 'verb' }), 'demoq');
  assert.equal(citationForm({ stem: `bo${OKINA}l`, pos: 'verb' }), `bo${OKINA}lmoq`);
  assert.equal(citationForm({ stem: 'kitob', pos: 'noun' }), 'kitob');
  assert.equal(citationForm({ stem: 'edi', pos: 'aux' }), 'edi');
});

test('zipfPerMillion: decreasing in rank and sums to ~1e6 over the whole list', () => {
  const n = 1000;
  let sum = 0;
  let prev = Infinity;
  for (let r = 1; r <= n; r++) {
    const f = zipfPerMillion(r, n);
    assert.ok(f < prev);
    prev = f;
    sum += f;
  }
  assert.ok(Math.abs(sum - 1e6) < 1e-6 * 1e6);
});

test('mergeSources: averages per-million across sources and drops lemmas seen in fewer than minSources', () => {
  const s1 = new Map([['a', 500], ['b', 300], ['solo', 900]]);
  const s2 = new Map([['a', 100], ['b', 300]]);
  const s3 = new Map([['b', 300]]);
  const merged = mergeSources([s1, s2, s3], { minSources: 2 });
  assert.deepEqual(merged.map((m) => m.key), ['b', 'a']);
  assert.equal(merged[0].score, 300);
  assert.equal(merged[1].score, 200);
  assert.deepEqual(merged[1].present, [0, 1]);
});

test('mergeSources: ties break by key so the output is deterministic', () => {
  const merged = mergeSources([new Map([['b', 1], ['a', 1]]), new Map([['b', 1], ['a', 1]])], { minSources: 1 });
  assert.deepEqual(merged.map((m) => m.key), ['a', 'b']);
});

test('chooseCandidate: segmentations into a 1–2 letter non-pronoun stem are not readings (yoshga ≠ yo + …)', () => {
  const priors = new Map([['yo', 1e6], ['yosh', 10], ['ha', 1e6], ['hali', 1]]);
  assert.deepEqual(chooseCandidate('yoshga', [A('yo', 'cnjcoo'), A('yosh', 'adj', 'subst', 'dat'), A('yosh', 'n', 'dat')], { priors }), { stem: 'yosh', pos: 'noun' });
  assert.deepEqual(chooseCandidate('hali', [A('ha', 'n', 'px3sp', 'nom'), A('hali', 'adv')], { priors }), { stem: 'hali', pos: 'adv' });
  // pronoun stems stay: uning → u
  assert.deepEqual(chooseCandidate('unga', [A('u', 'prn', 'pers', 'p3', 'sg', 'dat'), A('unga', 'n', 'nom')], { priors: new Map([['u', 100]]) }), { stem: 'u', pos: 'pron' });
});

test('chooseCandidate: copula forms built on ekan/edi/emas keep that lemma whatever the tags (ekanini → ekan)', () => {
  assert.deepEqual(chooseCandidate('ekanini', [A('e', 'cop', 'ger_past', 'px3sp', 'acc')]), { stem: 'ekan', pos: 'aux' });
  assert.deepEqual(chooseCandidate('emish', [A('e', 'cop', 'aor', 'p3', 'sg')]), { stem: 'emish', pos: 'aux' });
});

test('chooseCandidate: blocked stem|pos readings are ignored', () => {
  const analyses = [A('yo', 'v', 'iv', 'aor', 'p3', 'pl'), A('yosh', 'n', 'pl', 'nom')];
  const priors = new Map([['yomoq', 1e6], ['yosh', 1]]);
  assert.deepEqual(chooseCandidate('yoshlar', analyses, { priors }), { stem: 'yo', pos: 'verb' });
  assert.deepEqual(chooseCandidate('yoshlar', analyses, { priors, blocked: new Set(['yo|verb']) }), { stem: 'yosh', pos: 'noun' });
  assert.equal(chooseCandidate('ob', [A('ob', 'n', 'nom')], { blocked: new Set(['ob|noun']) }), null);
});

test('lemmaPriors: respects blocked readings', () => {
  const analyses = new Map([['yoshlar', [A('yo', 'v', 'iv', 'aor', 'p3', 'pl'), A('yosh', 'n', 'pl', 'nom')]]]);
  assert.deepEqual([...lemmaPriors(new Map([['yoshlar', 6]]), analyses, { blocked: new Set(['yo|verb']) })], [['yosh', 6]]);
});

test('parseCsv: header row → objects; quoted fields may hold commas and doubled quotes', () => {
  const rows = parseCsv('a,b,c\n1,"x, y",3\n4,"say ""hi""",6\n\n');
  assert.deepEqual(rows, [{ a: '1', b: 'x, y', c: '3' }, { a: '4', b: 'say "hi"', c: '6' }]);
});

test('parseLemmaFixes: block / merge / pos actions, apostrophes folded', () => {
  const fixes = parseLemmaFixes(
    "lemma,action,value,reason\nyo,block,verb,spurious\no'g'li,merge,o'g'il,\"vowel drop, oʻgʻil+i\"\nkam,pos,adj,label\n",
  );
  assert.deepEqual([...fixes.blocked], ['yo|verb']);
  assert.deepEqual([...fixes.merges], [[`o${OKINA}g${OKINA}li`, `o${OKINA}g${OKINA}il`]]);
  assert.deepEqual([...fixes.pos], [['kam', 'adj']]);
  assert.throws(() => parseLemmaFixes('lemma,action,value,reason\nx,rename,y,z\n'), /unknown action/);
});

test('chooseCandidate: a short stem is kept when it is the only reading (uyda → uy, oyda → oy)', () => {
  assert.deepEqual(chooseCandidate('uyda', [A('uy', 'n', 'loc')]), { stem: 'uy', pos: 'noun' });
  assert.deepEqual(chooseCandidate('otlar', [A('ot', 'n', 'pl', 'nom')]), { stem: 'ot', pos: 'noun' });
});
