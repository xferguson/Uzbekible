/**
 * core/similarity: edit distance over Uzbek game letters, Turkish→Uzbek correspondence rules,
 * transparency score and fuzzy matching. See docs/architecture.md.
 */
export { distance, letterDistance, lettersOf } from './distance.ts';
export { applyRules, RULES } from './rules.ts';
export type { Rule, RuleContext } from './rules.ts';
export { bestMatch, transparency } from './transparency.ts';
export type { Match } from './transparency.ts';
