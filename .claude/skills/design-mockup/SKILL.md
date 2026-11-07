---
name: design-mockup
description: Use when creating or revising visual design mockups for Uzbekible (design system, game screens, icon concepts — tasks D1, D2, D3 and future game design tasks). Covers the Uzbek tilework visual language, required states/viewports, publishing for review, and the approval gate.
---

# Design mockups & approval gate

Read `docs/design/brief.md` first. The visual identity — Uzbek tilework (Registan, Shah-i-Zinda majolica,
Khiva, girih geometry) in cobalt, turquoise, white, with gold/ochre — is a **product requirement**, and the
motif should be part of how each game *works*, not decoration.

## Process
1. Load the `artifact-design` skill before writing any page.
2. Build mockups as self-contained HTML in `docs/design/mockups/<task-id>-<slug>.html`
   (inline SVG for motifs; no external assets except Google Fonts).
   - Once `src/design/tokens.ts` exists (task U1), use those token names/values; before that, define tokens
     on `:root` exactly as named in `docs/design/brief.md` so they can be lifted into code.
   - Motifs: draw from the geometry in the brief (8-/10-/12-fold rosettes, girih tiles). Once
     `core/motif` exists, generate SVG from it instead of hand-drawing.
3. Every screen must show:
   - **Phone (390×844) first**, then tablet/desktop.
   - **Light and dark** themes.
   - All interactive **states** (idle, selected, correct, wrong/crack, disabled, focus-visible).
   - Text samples in **Uzbek Latin, Uzbek Cyrillic, Turkish, Russian, Persian (RTL), Arabic (RTL)**.
   - Reduced-motion note for every animation (what replaces it).
   - No English on game boards (only in long-press hint states).
4. Take screenshots with Playwright at deviceScaleFactor 2 into `docs/design/mockups/screens/`.
5. Publish the HTML as an Artifact so the user can review on their phone; put the link in the PR.
6. Open the PR with label **`needs-approval`** (see `pr-flow`). **Don't merge it** until the user explicitly approves in the session.
7. Record decisions: when the user approves, add an "Approved decisions" section to
   `docs/design/brief.md` (palette values, fonts, motif rules) in the same PR, then merge it (see `pr-flow`).

## Accessibility bar
- Text contrast ≥ 4.5:1 (≥ 3:1 for large/bold tile text) in both themes — check cobalt-on-white and
  white-on-cobalt, gold-on-cobalt.
- Never encode state by colour alone (add shape/icon/pattern: crack lines, star outline, check mark).
- Tap targets ≥ 44×44 px.

## Checklist
- [ ] Brief read; tokens named per brief
- [ ] Phone + desktop, light + dark, all states
- [ ] All six scripts rendered, RTL correct
- [ ] Motif tied to a mechanic (say which)
- [ ] Screenshots committed, Artifact link in PR, `needs-approval` label
