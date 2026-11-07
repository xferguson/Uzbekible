#!/usr/bin/env node
// Build content/sources/uz-freq-top1000.csv from the corpora listed in content/sources/SOURCES.md.
// See content/sources/freq/README.md for how to fetch the inputs and compile the analyser.
//
//   node content/sources/freq/build.mjs --cv <sentence-collector.txt> --uzcs <uzbek_corpus.txt> \
//     --kaharjan <frequent_words_list.txt> --fst <uzb.automorf.hfstol> --ud <a.conllu,b.conllu> \
//     [--top 1000] [--out content/sources]
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import {
  tokenize,
  foldApostrophes,
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

const { values: args } = parseArgs({
  options: {
    cv: { type: 'string' },
    uzcs: { type: 'string' },
    kaharjan: { type: 'string' },
    fst: { type: 'string' },
    ud: { type: 'string' },
    top: { type: 'string', default: '1000' },
    'kaharjan-limit': { type: 'string', default: '60000' },
    out: { type: 'string', default: 'content/sources' },
    debug: { type: 'string' },
  },
});
for (const k of ['cv', 'uzcs', 'kaharjan', 'fst', 'ud']) if (!args[k]) throw new Error(`--${k} is required`);
const TOP = Number(args.top);
const KAHARJAN_LIMIT = Number(args['kaharjan-limit']);

// Proper-noun heuristic for running text: capitalised in most non-sentence-initial occurrences.
const PROPN_MIN_NONINITIAL = 3;
const PROPN_CAP_RATIO = 0.5;

const SOURCE_KEYS = ['cv', 'uzcs', 'kaharjan'];

function countCorpus(path) {
  const counts = new Map();
  const nonInitial = new Map();
  const capNonInitial = new Map();
  let tokens = 0;
  let lines = 0;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    lines++;
    for (const t of tokenize(line)) {
      tokens++;
      counts.set(t.form, (counts.get(t.form) ?? 0) + 1);
      if (!t.initial) {
        nonInitial.set(t.form, (nonInitial.get(t.form) ?? 0) + 1);
        if (t.cap) capNonInitial.set(t.form, (capNonInitial.get(t.form) ?? 0) + 1);
      }
    }
  }
  const propn = new Set();
  for (const [form, n] of nonInitial) {
    if (n >= PROPN_MIN_NONINITIAL && (capNonInitial.get(form) ?? 0) / n > PROPN_CAP_RATIO) propn.add(form);
  }
  return { counts, propn, tokens, lines };
}

function readKaharjan(path) {
  const cyrl = readFileSync(path, 'utf8').split('\n').map((w) => w.trim().normalize('NFC').toLowerCase()).filter(Boolean);
  return { cyrl, attested: new Set(cyrl) };
}

function analyse(forms, fst) {
  const r = spawnSync('hfst-lookup', ['-q', fst], { input: forms.join('\n') + '\n', maxBuffer: 1 << 30, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`hfst-lookup failed: ${r.stderr}`);
  return parseAnalyses(r.stdout);
}

const cv = countCorpus(args.cv);
const uzcs = countCorpus(args.uzcs);
const kah = readKaharjan(args.kaharjan);
const kahTop = kah.cyrl.slice(0, KAHARJAN_LIMIT).map((c, i) => ({ rank: i + 1, latn: foldApostrophes(cyrlToLatn(c)) }));

const allForms = new Set([...cv.counts.keys(), ...uzcs.counts.keys(), ...kahTop.map((k) => k.latn)]);
const analyses = analyse([...allForms], args.fst);

// Reviewed fixes: overrides.csv (surface form → lemma) and lemma-fixes.csv (block / merge / pos).
const overrides = new Map(
  parseCsv(readFileSync(new URL('./overrides.csv', import.meta.url), 'utf8')).map((r) => [
    foldApostrophes(r.form),
    { stem: foldApostrophes(r.stem), pos: r.pos },
  ]),
);
const fixes = parseLemmaFixes(readFileSync(new URL('./lemma-fixes.csv', import.meta.url), 'utf8'));
const { blocked } = fixes;

// Form mass (per million, summed over sources) → lemma priors for disambiguation.
const formMass = new Map();
const addMass = (form, pm) => formMass.set(form, (formMass.get(form) ?? 0) + pm);
for (const corpus of [cv, uzcs]) {
  for (const [form, n] of corpus.counts) if (!corpus.propn.has(form)) addMass(form, (n / corpus.tokens) * 1e6);
}
for (const { rank, latn } of kahTop) addMass(latn, zipfPerMillion(rank, kah.cyrl.length));
const priors = lemmaPriors(formMass, analyses, { blocked });
const choose = (form, a) => chooseCandidate(form, a, { priors, overrides, blocked });

const lemmaOf = new Map();
const unknown = new Map(); // form → combined evidence, for the report
for (const form of allForms) {
  const c = choose(form, analyses.get(form) ?? []);
  if (c) lemmaOf.set(form, { lemma: fixes.merges.get(citationForm(c)) ?? citationForm(c), pos: c.pos });
}

// Per-source lemma frequencies (per million tokens) and raw counts.
const perMillion = SOURCE_KEYS.map(() => new Map());
const rawCount = new Map();
const posVotes = new Map(); // lemma → Map<pos, weight>
const formsOf = new Map(); // lemma → Map<form, weight>

function credit(srcIdx, form, pm, raw) {
  const l = lemmaOf.get(form);
  if (!l) {
    if (!(analyses.get(form) ?? []).length) unknown.set(form, (unknown.get(form) ?? 0) + pm);
    return;
  }
  const m = perMillion[srcIdx];
  m.set(l.lemma, (m.get(l.lemma) ?? 0) + pm);
  if (raw) rawCount.set(l.lemma, (rawCount.get(l.lemma) ?? 0) + raw);
  const pv = posVotes.get(l.lemma) ?? new Map();
  pv.set(l.pos, (pv.get(l.pos) ?? 0) + pm);
  posVotes.set(l.lemma, pv);
  const fv = formsOf.get(l.lemma) ?? new Map();
  fv.set(form, (fv.get(form) ?? 0) + pm);
  formsOf.set(l.lemma, fv);
}

for (const [i, corpus] of [cv, uzcs].entries()) {
  for (const [form, n] of corpus.counts) {
    if (corpus.propn.has(form)) continue;
    credit(i, form, (n / corpus.tokens) * 1e6, n);
  }
}
for (const { rank, latn } of kahTop) credit(2, latn, zipfPerMillion(rank, kah.cyrl.length), 0);

const merged = mergeSources(perMillion, { minSources: 2 });
const top = merged.slice(0, TOP);

const UPOS = { NOUN: 'noun', VERB: 'verb', AUX: 'aux', ADJ: 'adj', ADV: 'adv', PRON: 'pron', DET: 'det', ADP: 'adp', CCONJ: 'conj', SCONJ: 'conj', NUM: 'num', PART: 'part', INTJ: 'intj' };
const udTokens = [];
for (const p of args.ud.split(',')) {
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const f = line.split('\t');
    if (f.length !== 10 || !/^\d+$/.test(f[0]) || !UPOS[f[3]]) continue;
    const form = foldApostrophes(f[1]).toLowerCase();
    if (!/^[a-zʻʼ]+$/u.test(form)) continue;
    udTokens.push({ form, lemma: foldApostrophes(f[2]).toLowerCase(), upos: UPOS[f[3]] });
  }
}
// Gold POS per lemma (citation form) where UD has it ≥ UD_POS_MIN times.
const UD_POS_MIN = 3;
const udPos = new Map();
for (const t of udTokens) {
  const key = citationForm({ stem: t.lemma, pos: t.upos });
  const m = udPos.get(key) ?? new Map();
  m.set(t.upos, (m.get(t.upos) ?? 0) + 1);
  udPos.set(key, m);
}

const argmax = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
function posLabel(key) {
  if (fixes.pos.has(key)) return fixes.pos.get(key);
  const gold = udPos.get(key);
  if (gold) {
    const n = [...gold.values()].reduce((a, b) => a + b, 0);
    if (n >= UD_POS_MIN) return argmax(gold);
  }
  return argmax(posVotes.get(key));
}
const rows = top.map((m, i) => {
  const cyrl = latnToCyrl(m.key);
  return {
    rank: i + 1,
    lemma: m.key,
    cyrl,
    pos: posLabel(m.key),
    count: rawCount.get(m.key) ?? 0,
    source: m.present.map((p) => SOURCE_KEYS[p]).join(';'),
    cyrlAttested: kah.attested.has(cyrl),
    posFromUd: [...(udPos.get(m.key)?.values() ?? [])].reduce((a, b) => a + b, 0) >= UD_POS_MIN,
    topForms: [...formsOf.get(m.key).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f),
    score: m.score,
  };
});

const csv = ['rank,lemma,cyrl,pos,count,source', ...rows.map((r) => [r.rank, r.lemma, r.cyrl, r.pos, r.count, r.source].join(','))];
writeFileSync(join(args.out, `uz-freq-top${TOP}.csv`), csv.join('\n') + '\n');
if (args.debug) {
  const dbg = rows.map((r) => [r.rank, r.lemma, r.pos, r.count, r.source, r.score.toFixed(1), r.topForms.join(' ')].join('\t'));
  writeFileSync(args.debug, dbg.join('\n') + '\n');
}

// ---------------------------------------------------------------------------------------------------------
// Report: lemmatiser accuracy on UD gold, coverage, and items needing a human look.

const udAnalyses = analyse([...new Set(udTokens.map((t) => t.form))], args.fst);
let udLemmaOk = 0;
let udPosOk = 0;
let udCovered = 0;
const udErrors = new Map();
for (const t of udTokens) {
  const c = chooseCandidate(t.form, udAnalyses.get(t.form) ?? [], { priors, overrides, blocked });
  if (!c) continue;
  udCovered++;
  if (c.stem === t.lemma) udLemmaOk++;
  else {
    const k = `${t.form} → ours ${c.stem}, gold ${t.lemma}`;
    udErrors.set(k, (udErrors.get(k) ?? 0) + 1);
  }
  if (c.pos === t.upos) udPosOk++;
}

const pct = (a, b) => `${((100 * a) / b).toFixed(1)}%`;
const posDist = new Map();
for (const r of rows) posDist.set(r.pos, (posDist.get(r.pos) ?? 0) + 1);
const unattested = rows.filter((r) => !r.cyrlAttested);
const topUnknown = [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
const propnSample = [...cv.propn].filter((f) => (cv.counts.get(f) ?? 0) > 50).sort((a, b) => cv.counts.get(b) - cv.counts.get(a)).slice(0, 25);

const report = `# C1 build report (generated by content/sources/freq/build.mjs; do not edit by hand)

## Inputs
| key | tokens | lines/types | proper nouns filtered |
|---|---|---|---|
| cv | ${cv.tokens} | ${cv.lines} lines | ${cv.propn.size} forms |
| uzcs | ${uzcs.tokens} | ${uzcs.lines} lines | ${uzcs.propn.size} forms |
| kaharjan | n/a (ranked list) | ${kah.cyrl.length} types, top ${KAHARJAN_LIMIT} used | (list excludes proper nouns) |

Distinct forms analysed: ${allForms.size}. Forms with an accepted analysis: ${lemmaOf.size}.
Lemmas attested in ≥2 sources: ${merged.length}.

## Lemmatiser check against UD Uzbek gold (UT + UzUDT, all splits)
- Tokens with an alphabetic form and a content UPOS: ${udTokens.length}
- Covered by the analyser (non-null choice): ${udCovered} (${pct(udCovered, udTokens.length)})
- Lemma agreement on covered tokens: ${udLemmaOk} (${pct(udLemmaOk, udCovered)})
- POS agreement on covered tokens (analyser choice, before the UD relabelling of output rows): ${udPosOk} (${pct(udPosOk, udCovered)})
- Output rows whose POS label comes from UD gold (lemma seen ≥ ${UD_POS_MIN}× in UD): ${rows.filter((r) => r.posFromUd).length}

Most frequent lemma disagreements (many are gold-annotation conventions, e.g. UD keeping deb/edi as lemmas):
${[...udErrors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => `- ${n}× ${k}`).join('\n')}

## Output (top ${TOP})
POS: ${[...posDist.entries()].sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p} ${n}`).join(', ')}

Sources per lemma: all three ${rows.filter((r) => r.present?.length === 3 || r.source.split(';').length === 3).length}, two ${rows.filter((r) => r.source.split(';').length === 2).length}.

### Generated Cyrillic not found verbatim in the kaharjan Cyrillic list (check by hand)
${unattested.length ? unattested.map((r) => `- ${r.rank} ${r.lemma} → ${r.cyrl}`).join('\n') : '- none'}

### Lemma → most frequent surface forms (first 100 ranks)
| rank | lemma | pos | top forms |
|---|---|---|---|
${rows.slice(0, 100).map((r) => `| ${r.rank} | ${r.lemma} | ${r.pos} | ${r.topForms.join(', ')} |`).join('\n')}

### Highest-frequency forms with no analysis (excluded)
${topUnknown.map(([f, s]) => `- ${f} (${s.toFixed(0)} per million, summed over sources)`).join('\n')}

### Sample of forms filtered as proper nouns in cv (count > 50)
${propnSample.join(', ')}
`;
writeFileSync(join(args.out, 'freq', 'report.md'), report);
console.log(`wrote ${rows.length} rows; UD lemma agreement ${pct(udLemmaOk, udCovered)}, coverage ${pct(udCovered, udTokens.length)}`);
