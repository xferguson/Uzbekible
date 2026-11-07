# C4 inflected pairs

Generates [`../../items/inflected-0001-0200.yaml`](../../items/inflected-0001-0200.yaml): 252 `form: inflected`
items for 30 nouns and 36 verbs from the top-200 lemmas (`node content/sources/inflected/build.mjs`, no network).

| file | what |
|---|---|
| `morph.mjs` | the Uzbek and Turkish suffix rules (pure functions) and the list of forms |
| `build.mjs` | the lemma lists (`NOUNS`, `VERBS`) and the YAML writer; edit these, then rebuild |
| `morph.test.mjs` | rule tests with known forms, plus checks over the generated YAML (Vitest, `npm test`) |

Forms: plural `-lar`, possessive 1sg `-im` and 2sg `-ing`, locative `-da`, dative `-ga`, ablative `-dan` (nouns, six
each); past `-di` + `-m` and present continuous `-yap-` + `-man` (verbs, 1sg). Each item has `lemma`, `suffixes` (the
Uzbek endings), an inflected Turkish source and a `tags` entry naming the form.

- **`divergent-suffix`** marks the present continuous: Uzbek `-yap-` against Turkish `-iyor-` (`kelyapman` ↔
  `geliyorum`). Every other suffix here has the same shape in both languages (with Turkish vowel harmony and
  voicing: `uyda` ↔ `evde`, `kitobda` ↔ `kitapta`).
- **Lemma choice.** A lemma is included when both languages inflect it regularly and its Turkish partner is not a
  false friend. Irregular stems (`shahar` → `shahrim`, `şehir` → `şehrim`; `oʻgʻil` → `oʻglim`, `oğul` → `oğlum`)
  are left out rather than special-cased. Turkish exceptions that are handled: consonant softening (`kitabım`),
  buffer y (`suyum`), front harmony in `saat` (`saatte`), and the verbs `et-`, `git-`, `de-` (`ediyorum`,
  `gidiyorum`, `diyorum`).
- **Relation, confidence and sound shifts** are copied from the lemma's Turkish source (minus `mak>moq`), since the
  stem is unchanged. `ref` is `lemma:<id>; rule:C4-morph`. The forms come from the rules, not from a dictionary, so
  a native-speaker check of the Turkish side is cheap and worthwhile in C6.
- **Cyrillic** is built from Cyrillic suffixes and must equal `latnToCyrl` (`core/text`); the test enforces it.
