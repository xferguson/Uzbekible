#!/usr/bin/env node
// C3 build: curated Russian/Persian/Arabic origin words + EtymDB evidence → ru/fa/ar sources in content/items/freq-*.yaml,
// evidence.tsv and report.md. Run after content/sources/cognates/build.mjs (which keeps these sources on rebuild).
// Usage: node content/sources/loans/build.mjs --etymdb <EtymDB/data/split_etymdb>   (see README.md)
import { readFileSync, writeFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, Document, visit, isPair, isScalar } from 'yaml';
import { OKINA, lowerTr, validateItems } from '../cognates/lib.mjs';
import { parseCsv } from '../freq/lib.mjs';
import {
  LOAN_LANGS,
  parseLoanRows,
  foldArabic,
  foldRussian,
  scriptErrors,
  originSupports,
  loanItemSources,
} from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const etymArg = process.argv.indexOf('--etymdb');
const etymDir = etymArg > 0 ? process.argv[etymArg + 1] : undefined;
if (!etymDir) {
  console.error('usage: build.mjs --etymdb <EtymDB split_etymdb dir>');
  process.exit(2);
}

const foldTr = (s) => lowerTr(s).replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
const foldUz = (s) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/([og])['‘’`ʼ´]/g, `$1${OKINA}`);

async function lines(path, fn) {
  const rl = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) fn(line);
}

/** EtymDB → Map("uz|lemma" or "tr|word" → list of ancestor chains, each a list of [lang, text]). */
async function loadEtymDb(dir) {
  const vals = new Map();
  const want = new Map();
  await lines(join(dir, 'etymdb_values.csv'), (line) => {
    const p = line.split('\t');
    if (p.length < 4) return;
    const id = Number(p[0]);
    vals.set(id, [p[1], p[3]]);
    if (p[1] === 'uz' || p[1] === 'tr') {
      const key = `${p[1]}|${p[1] === 'uz' ? foldUz(p[3]) : foldTr(p[3])}`;
      want.set(key, [...(want.get(key) ?? []), id]);
    }
  });
  const multi = new Map();
  await lines(join(dir, 'etymdb_links_index.csv'), (line) => {
    const p = line.split('\t').map(Number);
    multi.set(p[0], p.slice(1));
  });
  const parents = new Map();
  await lines(join(dir, 'etymdb_links_info.csv'), (line) => {
    const [type, c, pa] = line.split('\t');
    if (type === 'cog') return;
    const ps = Number(pa) < 0 ? (multi.get(Number(pa)) ?? []) : [Number(pa)];
    parents.set(Number(c), [...(parents.get(Number(c)) ?? []), ...ps]);
  });
  const chain = (id) => {
    const out = [];
    let frontier = [id];
    const seen = new Set([id]);
    for (let depth = 0; depth < 6 && frontier.length; depth++) {
      const next = [];
      for (const f of frontier) {
        for (const p of parents.get(f) ?? []) {
          if (seen.has(p) || !vals.has(p)) continue;
          seen.add(p);
          out.push(vals.get(p));
          next.push(p);
        }
      }
      frontier = next;
    }
    return out;
  };
  const chains = new Map();
  for (const [key, ids] of want)
    chains.set(
      key,
      ids.map(chain).filter((c) => c.length > 0),
    );
  return chains;
}

const freq = parseCsv(readFileSync(join(root, 'content/sources/uz-freq-top1000.csv'), 'utf8'));
const rows = parseLoanRows(readFileSync(join(here, 'curated.tsv'), 'utf8'));
const byRank = new Map(freq.map((f) => [Number(f.rank), f]));
const seenRank = new Set();
for (const r of rows) {
  const f = byRank.get(r.rank);
  if (!f || f.lemma !== r.lemma)
    throw new Error(`curated.tsv: rank ${r.rank} "${r.lemma}" does not match the frequency list`);
  if (seenRank.has(r.rank)) throw new Error(`curated.tsv: rank ${r.rank} appears twice`);
  seenRank.add(r.rank);
  for (const lang of Object.keys(LOAN_LANGS))
    for (const t of r[lang]) {
      const errs = scriptErrors(lang, t);
      if (errs.length) throw new Error(`curated.tsv rank ${r.rank} ${lang}: ${errs.join('; ')}`);
    }
}
const rowByRank = new Map(rows.map((r) => [r.rank, r]));

const etym = await loadEtymDb(etymDir);

const bandName = (b) =>
  `freq-${String(b * 100 + 1).padStart(4, '0')}-${String((b + 1) * 100).padStart(4, '0')}.yaml`;
const bands = [];
for (let b = 0; b < 10; b++) {
  const path = join(root, 'content/items', bandName(b));
  bands.push({ path, items: parseYaml(readFileSync(path, 'utf8')) });
}

const foldFor = (lang, s) => (lang === 'ru' ? foldRussian(s) : foldArabic(s));
const evidenceRows = [
  ['rank', 'lemma', 'lang', 'text', 'uz_etymology', 'tr_etymology', 'exact_word', 'confidence'],
];
const added = []; // { it, s, exact }
for (const { items } of bands) {
  for (const it of items) {
    const kept = it.sources.filter((s) => !(s.lang in LOAN_LANGS));
    const row = rowByRank.get(it.freqRank);
    const fresh = [];
    if (row) {
      const uzChains = etym.get(`uz|${foldUz(row.lemma)}`) ?? [];
      const trSources = kept.filter((s) => s.lang === 'tr');
      for (const lang of Object.keys(LOAN_LANGS)) {
        if (row[lang].length === 0) continue;
        const uzOrigin = uzChains.some((c) =>
          originSupports(
            lang,
            c.map((x) => x[0]),
          ),
        );
        let trOrigin = false;
        let trText;
        let trChains = [];
        for (const s of trSources) {
          const cs = etym.get(`tr|${foldTr(s.text)}`) ?? [];
          if (
            cs.some((c) =>
              originSupports(
                lang,
                c.map((x) => x[0]),
              ),
            )
          ) {
            trOrigin = true;
            trText = s.text;
            trChains = cs;
            break;
          }
        }
        const sub = { ...row, ru: [], fa: [], ar: [], [lang]: row[lang] };
        const srcs = loanItemSources(sub, {
          uz: { [lang]: uzOrigin },
          tr: { [lang]: trOrigin },
          trText,
        });
        for (const s of srcs) {
          const ancestors = [...uzChains, ...trChains]
            .flat()
            .filter((x) => x[0] === lang || lang !== 'ru');
          const exact = ancestors.some(
            ([l, t]) =>
              (l === lang || (lang !== 'ru' && l !== 'ru')) &&
              foldFor(lang, t) === foldFor(lang, s.text),
          );
          fresh.push(s);
          added.push({ it, s, exact });
          evidenceRows.push([
            it.freqRank,
            row.lemma,
            lang,
            s.text,
            uzOrigin ? 'yes' : 'no',
            trOrigin ? 'yes' : 'no',
            exact ? 'yes' : 'no',
            s.confidence,
          ]);
        }
      }
    }
    it.sources = [...kept, ...fresh];
  }
}

const header = (b) =>
  `# Uzbek top-1000 lemmas, ranks ${b * 100 + 1}-${(b + 1) * 100}.\n` +
  '# Turkish sources are generated by content/sources/cognates/build.mjs from curated.tsv: edit curated.tsv, then rebuild.\n' +
  '# Russian, Persian and Arabic sources (task C3) are generated by content/sources/loans/build.mjs and kept by the Turkish build.\n';
bands.forEach(({ path, items }, b) => {
  const doc = new Document(items);
  visit(doc, {
    Pair(_, pair) {
      if (
        isPair(pair) &&
        isScalar(pair.key) &&
        ['uz', 'correspondence', 'tags'].includes(pair.key.value)
      )
        pair.value.flow = true;
    },
  });
  writeFileSync(path, header(b) + doc.toString({ lineWidth: 0 }));
});

const allItems = bands.flatMap((b) => b.items);
const errors = validateItems(allItems);
if (errors.length) throw new Error(`invalid items:\n${errors.join('\n')}`);
writeFileSync(join(here, 'evidence.tsv'), evidenceRows.map((r) => r.join('\t')).join('\n') + '\n');

// --- report ---------------------------------------------------------------------------------------------------
const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
const withLoan = (it) => it.sources.some((s) => s.lang in LOAN_LANGS);
const cov = [100, 200, 500, 1000].map((n) => {
  const top = allItems.slice(0, n);
  const k = top.filter(withLoan).length;
  return `| top ${n} | ${k} | ${((100 * k) / n).toFixed(1)}% |`;
});
const perLang = Object.keys(LOAN_LANGS).map((lang) => {
  const c = count(added.filter(({ s }) => s.lang === lang).map(({ s }) => s.confidence));
  const n = added.filter(({ s }) => s.lang === lang).length;
  return `| ${lang} | ${LOAN_LANGS[lang]} | ${n} | ${c.get('high') ?? 0} | ${c.get('medium') ?? 0} | ${c.get('low') ?? 0} |`;
});
const conf = count(added.map(({ s }) => s.confidence));
const low = added.filter(({ s }) => s.confidence === 'low');
const loose = added.filter(({ s, exact }) => !exact && s.confidence !== 'low');
// Where the C2 Turkish relation says one origin (shared-arabic / shared-persian) but the curated partner is the other.
const wantLang = { 'shared-arabic': 'ar', 'shared-persian': 'fa' };
const disagree = allItems.filter((it) => {
  const want = it.sources
    .filter((s) => s.lang === 'tr' && wantLang[s.relation])
    .map((s) => wantLang[s.relation]);
  const have = it.sources.filter((s) => s.lang === 'fa' || s.lang === 'ar').map((s) => s.lang);
  return want.length > 0 && have.length > 0 && !want.some((w) => have.includes(w));
});
const unmapped = allItems.filter(
  (it) =>
    it.sources.some((s) => s.lang === 'tr' && wantLang[s.relation]) &&
    !it.sources.some((s) => s.lang === 'fa' || s.lang === 'ar'),
);
const report = [
  '# C3 build report (generated by content/sources/loans/build.mjs; do not edit by hand)',
  '',
  `Items: ${allItems.length}. Items with a Russian, Persian or Arabic partner: ${allItems.filter(withLoan).length}. Partner sources: ${added.length}.`,
  '',
  '## Coverage',
  '| band | items with a ru/fa/ar partner | share |',
  '|---|---|---|',
  ...cov,
  '',
  '## Language × confidence',
  '| lang | relation | sources | high | medium | low |',
  '|---|---|---|---|---|---|',
  ...perLang,
  `| **all** | | ${added.length} | ${conf.get('high') ?? 0} | ${conf.get('medium') ?? 0} | ${conf.get('low') ?? 0} |`,
  '',
  `## Low-confidence sources (${low.length}): review these in C6`,
  'No Wiktionary etymology entry (Uzbek or Turkish) reaches the claimed language; curator judgement only.',
  '| rank | uz | lang | partner | gloss |',
  '|---|---|---|---|---|',
  ...low.map(
    ({ it, s }) => `| ${it.freqRank} | ${it.uz.latn} | ${s.lang} | ${s.text} | ${it.glossEn} |`,
  ),
  '',
  `## Spelling not found in an etymology chain (${loose.length})`,
  'An etymology entry reaches the language but lists the origin word in another spelling or form. Worth a glance, not necessarily wrong.',
  '| rank | uz | lang | partner | confidence |',
  '|---|---|---|---|---|',
  ...loose.map(
    ({ it, s }) => `| ${it.freqRank} | ${it.uz.latn} | ${s.lang} | ${s.text} | ${s.confidence} |`,
  ),
  '',
  `## Different origin language from C2's Turkish relation (${disagree.length})`,
  'C2 called the Turkish partner shared-arabic / shared-persian; the partner recorded here is the other language (Persian-mediated Arabic words and the like).',
  '| rank | uz | C2 relation | partner here |',
  '|---|---|---|---|',
  ...disagree.map(
    (it) =>
      `| ${it.freqRank} | ${it.uz.latn} | ${it.sources
        .filter((s) => s.lang === 'tr' && wantLang[s.relation])
        .map((s) => s.relation)
        .join(', ')} | ${it.sources
        .filter((s) => s.lang === 'fa' || s.lang === 'ar')
        .map((s) => `${s.lang}:${s.text}`)
        .join(', ')} |`,
  ),
  '',
  `## Shared Arabic/Persian words in C2 without a partner here (${unmapped.length})`,
  '| rank | uz | C2 relation | tr |',
  '|---|---|---|---|',
  ...unmapped.map(
    (it) =>
      `| ${it.freqRank} | ${it.uz.latn} | ${it.sources
        .filter((s) => s.lang === 'tr' && wantLang[s.relation])
        .map((s) => s.relation)
        .join(', ')} | ${it.sources
        .filter((s) => s.lang === 'tr')
        .map((s) => s.text)
        .join(', ')} |`,
  ),
  '',
];
writeFileSync(join(here, 'report.md'), report.join('\n'));
console.log(`wrote 10 item files, ${added.length} partner sources; low: ${low.length}`);
