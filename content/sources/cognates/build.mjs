#!/usr/bin/env node
// C2 build: curated Turkish partners + evidence → content/items/freq-*.yaml and report.md.
// Usage: node content/sources/cognates/build.mjs --apertium <tur-uzb.dix> --etymdb <EtymDB/data/split_etymdb>
// See README.md for how to fetch the pinned inputs.
import { readFileSync, writeFileSync, existsSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, Document, visit, isPair, isScalar } from 'yaml';
import {
  OKINA,
  lowerTr,
  parseCurated,
  correspondences,
  supportsRelation,
  confidenceFor,
  parseApertiumDix,
  itemIds,
  validateItems,
} from './lib.mjs';
import { parseCsv } from '../freq/lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc),
      [],
    ),
);
if (!args.apertium || !args.etymdb) {
  console.error(
    'usage: build.mjs --apertium <apertium-tur-uzb.tur-uzb.dix> --etymdb <EtymDB split_etymdb dir>',
  );
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

/** EtymDB → Map("uz|lemma" or "tr|word" → list of ancestor-language chains). */
async function loadEtymDb(dir) {
  const vals = new Map();
  const want = new Map();
  await lines(join(dir, 'etymdb_values.csv'), (line) => {
    const p = line.split('\t');
    if (p.length < 4) return;
    const id = Number(p[0]);
    vals.set(id, p[1]);
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
const curated = parseCurated(readFileSync(join(here, 'curated.tsv'), 'utf8'));
if (curated.length !== freq.length)
  throw new Error(`curated.tsv has ${curated.length} rows, freq list ${freq.length}`);
curated.forEach((r, i) => {
  if (r.rank !== Number(freq[i].rank) || r.lemma !== freq[i].lemma) {
    throw new Error(
      `curated.tsv row ${i + 2} (${r.rank} ${r.lemma}) does not match freq list (${freq[i].rank} ${freq[i].lemma})`,
    );
  }
});

const dict = parseApertiumDix(readFileSync(args.apertium, 'utf8'));
const etym = await loadEtymDb(args.etymdb);

const ids = itemIds(curated);
const evidenceRows = [
  ['rank', 'lemma', 'tr', 'relation', 'dictionary', 'etymology', 'confidence', 'correspondence'],
];
const items = curated.map((r, i) => {
  const f = freq[i];
  const stem = f.pos === 'verb' && r.lemma.endsWith('moq') ? r.lemma.slice(0, -3) : r.lemma;
  const dictTr = (dict.get(stem.toLowerCase()) ?? []).map((e) => foldTr(e.text));
  const uzChains = etym.get(`uz|${foldUz(r.lemma)}`) ?? [];
  const sources = r.tr.map((s) => {
    const trChains = etym.get(`tr|${foldTr(s.text)}`) ?? [];
    const meaning = dictTr.includes(foldTr(s.text));
    const otherMeaning = dictTr.length > 0;
    const uzOrigin = uzChains.some((c) => supportsRelation(s.relation, c));
    const trOrigin = trChains.some((c) => supportsRelation(s.relation, c));
    // A false friend's two words still share an etymology (or a look-alike origin): use whichever side is known.
    const ffOrigin = s.relation === 'false-friend' && (uzChains.length > 0 || trChains.length > 0);
    const origin = uzOrigin || trOrigin || ffOrigin;
    const confidence = confidenceFor(s.relation, { meaning, otherMeaning, origin });
    const refs = [];
    if (s.relation === 'false-friend') {
      if (otherMeaning && !meaning)
        refs.push(`apertium-tur-uzb:${stem}=${dictTr.slice(0, 2).join(',')}`);
      if (uzChains.length) refs.push(`wiktionary:${r.lemma}`);
      if (trChains.length) refs.push(`wiktionary:${s.text}`);
    } else {
      if (meaning) refs.push(`apertium-tur-uzb:${s.text}`);
      if (uzOrigin) refs.push(`wiktionary:${r.lemma}`);
      if (trOrigin) refs.push(`wiktionary:${s.text}`);
    }
    if (refs.length === 0) refs.push('curator:C2');
    const correspondence = s.relation === 'false-friend' ? [] : correspondences(s.text, r.lemma);
    evidenceRows.push([
      r.rank,
      r.lemma,
      s.text,
      s.relation,
      meaning ? 'yes' : otherMeaning ? 'other' : 'none',
      origin ? 'yes' : 'no',
      confidence,
      correspondence.join(' '),
    ]);
    return {
      lang: 'tr',
      text: s.text,
      relation: s.relation,
      confidence,
      ...(correspondence.length ? { correspondence } : {}),
      ref: refs.join('; '),
    };
  });
  return {
    id: ids[i],
    uz: { latn: r.lemma, cyrl: f.cyrl },
    freqRank: r.rank,
    form: 'lemma',
    pos: f.pos,
    glossEn: r.glossEn,
    sources,
    tags: [],
  };
});

// Write one file per 100 ranks. Non-Turkish sources already in a file (task C3) are kept.
for (let b = 0; b < 10; b++) {
  const name = `freq-${String(b * 100 + 1).padStart(4, '0')}-${String((b + 1) * 100).padStart(4, '0')}.yaml`;
  const path = join(root, 'content/items', name);
  const existing = existsSync(path) ? (parseYaml(readFileSync(path, 'utf8')) ?? []) : [];
  const keep = new Map(
    existing.map((it) => [it.id, (it.sources ?? []).filter((s) => s.lang !== 'tr')]),
  );
  const band = items
    .slice(b * 100, (b + 1) * 100)
    .map((it) => ({ ...it, sources: [...it.sources, ...(keep.get(it.id) ?? [])] }));
  const header =
    `# Uzbek top-1000 lemmas, ranks ${b * 100 + 1}-${(b + 1) * 100}.\n` +
    '# Turkish sources are generated by content/sources/cognates/build.mjs from curated.tsv: edit curated.tsv, then rebuild.\n' +
    '# Russian, Persian and Arabic sources (task C3) are generated by content/sources/loans/build.mjs and kept by the Turkish build.\n';
  const doc = new Document(band);
  // Short maps and lists on one line (uz: { latn, cyrl }, correspondence: [..], tags: []) keep the files scannable.
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
  writeFileSync(path, header + doc.toString({ lineWidth: 0 }));
}

const errors = validateItems(items);
if (errors.length) throw new Error(`invalid items:\n${errors.join('\n')}`);
writeFileSync(join(here, 'evidence.tsv'), evidenceRows.map((r) => r.join('\t')).join('\n') + '\n');

// --- report ---------------------------------------------------------------------------------------------------
const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
const table = (m) => [...m].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
const trSources = items.flatMap((it) =>
  it.sources.filter((s) => s.lang === 'tr').map((s) => ({ it, s })),
);
const partner = (it) => it.sources.some((s) => s.lang === 'tr' && s.relation !== 'false-friend');
const cov = [100, 200, 500, 1000].map((n) => {
  const top = items.slice(0, n);
  const k = top.filter(partner).length;
  return `| top ${n} | ${k} | ${((100 * k) / n).toFixed(1)}% | ${top.filter((it) => it.sources.some((s) => s.relation === 'false-friend')).length} |`;
});
const rel = count(trSources.map(({ s }) => s.relation));
const conf = count(trSources.map(({ s }) => s.confidence));
const relConf = table(rel).map(([r]) => {
  const c = count(trSources.filter(({ s }) => s.relation === r).map(({ s }) => s.confidence));
  return `| ${r} | ${rel.get(r)} | ${c.get('high') ?? 0} | ${c.get('medium') ?? 0} | ${c.get('low') ?? 0} |`;
});
const tags = count(trSources.flatMap(({ s }) => s.correspondence ?? []));
const low = trSources.filter(({ s }) => s.confidence === 'low');
const ffs = trSources.filter(({ s }) => s.relation === 'false-friend');
const report = [
  '# C2 build report (generated by content/sources/cognates/build.mjs; do not edit by hand)',
  '',
  `Items: ${items.length}. Turkish sources: ${trSources.length}. Items with a Turkish partner (not counting false friends): ${items.filter(partner).length}.`,
  '',
  '## Coverage',
  '| band | items with a partner | share | items with a false friend |',
  '|---|---|---|---|',
  ...cov,
  '',
  '## Relation × confidence',
  '| relation | sources | high | medium | low |',
  '|---|---|---|---|---|',
  ...relConf,
  `| **all** | ${trSources.length} | ${conf.get('high') ?? 0} | ${conf.get('medium') ?? 0} | ${conf.get('low') ?? 0} |`,
  '',
  '## Correspondence tags',
  '| tag | pairs |',
  '|---|---|',
  ...table(tags).map(([t, n]) => `| \`${t}\` | ${n} |`),
  '',
  `## Low-confidence sources (${low.length}): review these in C6`,
  '| rank | uz | tr | relation | gloss |',
  '|---|---|---|---|---|',
  ...low.map(
    ({ it, s }) => `| ${it.freqRank} | ${it.uz.latn} | ${s.text} | ${s.relation} | ${it.glossEn} |`,
  ),
  '',
  `## False friends (${ffs.length})`,
  '| rank | uz | gloss | tr look-alike | confidence |',
  '|---|---|---|---|---|',
  ...ffs.map(
    ({ it, s }) =>
      `| ${it.freqRank} | ${it.uz.latn} | ${it.glossEn} | ${s.text} | ${s.confidence} |`,
  ),
  '',
];
writeFileSync(join(here, 'report.md'), report.join('\n'));
console.log(`wrote 10 item files, ${trSources.length} Turkish sources; low: ${low.length}`);
