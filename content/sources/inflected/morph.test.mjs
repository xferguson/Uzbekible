// Tests for the C4 inflection rules and the generated content/items/inflected-*.yaml (run by Vitest: npm test).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { uzNoun, trNoun, uzVerb, trVerb, NOUN_FORMS, VERB_FORMS } from './morph.mjs';
import { validateItems } from '../cognates/lib.mjs';
import { latnToCyrl, cyrlToLatn } from '../../../src/core/text/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const itemsDir = join(here, '..', '..', 'items');
const load = (re) =>
  readdirSync(itemsDir)
    .filter((f) => re.test(f))
    .flatMap((f) => parseYaml(readFileSync(join(itemsDir, f), 'utf8')));

test('Uzbek noun suffixes: vowel/consonant stems and -ga/-ka/-qa', () => {
  assert.deepEqual(uzNoun('uy', 'уй'), {
    plural: ['uylar', 'уйлар'],
    poss1: ['uyim', 'уйим'],
    poss2: ['uying', 'уйинг'],
    locative: ['uyda', 'уйда'],
    dative: ['uyga', 'уйга'],
    ablative: ['uydan', 'уйдан'],
  });
  assert.equal(uzNoun('ona', 'она').poss1[0], 'onam');
  assert.equal(uzNoun('ona', 'она').poss2[1], 'онанг');
  assert.equal(uzNoun('xalq', 'халқ').dative[0], 'xalqqa');
  assert.equal(uzNoun('xalq', 'халқ').dative[1], 'халққа');
  assert.equal(uzNoun('dunyo', 'дунё').poss1[0], 'dunyom');
});

test('Turkish noun suffixes: harmony, voiceless consonants, softening, buffer y', () => {
  assert.deepEqual(trNoun('ev'), {
    plural: 'evler',
    poss1: 'evim',
    poss2: 'evin',
    locative: 'evde',
    dative: 'eve',
    ablative: 'evden',
  });
  assert.equal(trNoun('yol').poss1, 'yolum');
  assert.equal(trNoun('göz').poss1, 'gözüm');
  assert.equal(trNoun('göz').poss2, 'gözün');
  assert.equal(trNoun('kız').poss1, 'kızım');
  assert.equal(trNoun('kitap').poss1, 'kitabım');
  assert.equal(trNoun('kitap').dative, 'kitaba');
  assert.equal(trNoun('kitap').locative, 'kitapta');
  assert.equal(trNoun('kitap').ablative, 'kitaptan');
  assert.equal(trNoun('dost').locative, 'dostta');
  assert.equal(trNoun('ana').poss1, 'anam');
  assert.equal(trNoun('ana').dative, 'anaya');
  assert.equal(trNoun('su').poss1, 'suyum');
  assert.equal(trNoun('su').locative, 'suda');
  assert.equal(trNoun('makine').poss1, 'makinem');
  assert.equal(trNoun('saat').locative, 'saatte');
});

test('Uzbek verbs: past -di and present continuous -yap-', () => {
  assert.deepEqual(uzVerb('kelmoq', 'келмоқ'), {
    past: ['keldim', 'келдим'],
    continuous: ['kelyapman', 'келяпман'],
  });
  assert.equal(uzVerb('oʻqimoq', 'ўқимоқ').continuous[0], 'oʻqiyapman');
  assert.equal(uzVerb('oʻqimoq', 'ўқимоқ').continuous[1], 'ўқияпман');
  assert.equal(uzVerb('chiqmoq', 'чиқмоқ').past[0], 'chiqdim');
  assert.equal(uzVerb('demoq', 'демоқ').continuous[0], 'deyapman');
});

test('Turkish verbs: -di with assimilation, -iyor with harmony, vowel-final stems, irregulars', () => {
  assert.deepEqual(trVerb('gelmek'), { past: 'geldim', continuous: 'geliyorum' });
  assert.deepEqual(trVerb('çıkmak'), { past: 'çıktım', continuous: 'çıkıyorum' });
  assert.deepEqual(trVerb('görmek'), { past: 'gördüm', continuous: 'görüyorum' });
  assert.deepEqual(trVerb('olmak'), { past: 'oldum', continuous: 'oluyorum' });
  assert.deepEqual(trVerb('gitmek'), { past: 'gittim', continuous: 'gidiyorum' });
  assert.deepEqual(trVerb('etmek'), { past: 'ettim', continuous: 'ediyorum' });
  assert.deepEqual(trVerb('demek'), { past: 'dedim', continuous: 'diyorum' });
  assert.deepEqual(trVerb('başlamak'), { past: 'başladım', continuous: 'başlıyorum' });
  assert.deepEqual(trVerb('işlemek'), { past: 'işledim', continuous: 'işliyorum' });
  assert.deepEqual(trVerb('okumak'), { past: 'okudum', continuous: 'okuyorum' });
  assert.deepEqual(trVerb('yürümek'), { past: 'yürüdüm', continuous: 'yürüyorum' });
  assert.deepEqual(trVerb('düşmek'), { past: 'düştüm', continuous: 'düşüyorum' });
});

const items = load(/^inflected-.*\.yaml$/);
const all = load(/\.yaml$/);
const lemmas = new Map(load(/^freq-.*\.yaml$/).map((i) => [i.id, i]));

test('C4 data: at least 150 inflected items, valid under the local schema, unique ids', () => {
  assert.ok(items.length >= 150, `only ${items.length} items`);
  assert.deepEqual(validateItems(all), []);
});

test('C4 data: every item is inflected, points at a top-200 lemma and has suffixes and a Turkish source', () => {
  for (const it of items) {
    assert.equal(it.form, 'inflected', it.id);
    const lemma = lemmas.get(it.lemma);
    assert.ok(lemma, `${it.id}: unknown lemma ${it.lemma}`);
    assert.ok(lemma.freqRank <= 200, `${it.id}: lemma outside the top 200`);
    assert.equal(it.freqRank, lemma.freqRank);
    assert.ok(it.suffixes?.length > 0 && it.suffixes.every((s) => /^-\S+$/.test(s)), it.id);
    const tr = it.sources.filter((s) => s.lang === 'tr');
    assert.ok(tr.length >= 1, `${it.id}: no Turkish source`);
    for (const s of tr) assert.notEqual(s.relation, 'false-friend', it.id);
  }
});

test('C4 data: all required suffix kinds are covered', () => {
  const kinds = new Set(items.flatMap((i) => i.tags));
  for (const k of [...NOUN_FORMS, ...VERB_FORMS].map((f) => f.tag)) assert.ok(kinds.has(k), `no ${k} items`);
  assert.ok(kinds.has('divergent-suffix'));
});

test('C4 data: divergent-suffix is exactly the present-continuous (-yap- vs -iyor-) items', () => {
  for (const it of items) {
    assert.equal(it.tags.includes('divergent-suffix'), it.tags.includes('present-continuous'), it.id);
  }
});

test('C4 data: Cyrillic agrees with the converter (stored Cyrillic wins; a mismatch must be fixed in morph.mjs)', () => {
  for (const it of items) {
    assert.equal(latnToCyrl(it.uz.latn), it.uz.cyrl, it.id);
    assert.equal(cyrlToLatn(it.uz.cyrl), it.uz.latn, it.id);
  }
});
