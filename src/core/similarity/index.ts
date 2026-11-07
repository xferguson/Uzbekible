/**
 * core/similarity: edit distance over Uzbek game letters, Turkish→Uzbek correspondence rules,
 * transparency score and fuzzy matching. See docs/architecture.md.
 */
export { distance, letterDistance, lettersOf } from './distance';
export { applyRules, RULES } from './rules';
export type { Rule, RuleContext } from './rules';
export { bestMatch, transparency } from './transparency';
export type { Match } from './transparency';
