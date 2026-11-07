# Design mockups

| File | Task | What |
|---|---|---|
| `D1-design-system.html` | D1 | Palette and contrast, type in six scripts, motif library, tile states, motion, icon concepts, home screen |
| `contrast.mjs` | D1, D2 | WCAG contrast check of the palette (D2 adds `--on-gold`): `node docs/design/mockups/contrast.mjs` (exit 1 on any failing pair) |
| `screenshot.mjs` | D1 | Regenerates `screens/D1-*.png` at deviceScaleFactor 2: `node docs/design/mockups/screenshot.mjs` |
| `D2-juft-screens.html` | D2 | Every Juft screen (phone and desktop, light and dark), board samples in all six scripts, match/crack/hint storyboards with reduced-motion versions, a playable three-pair prototype, the timing table |
| `screenshot-d2.mjs` | D2 | Regenerates `screens/D2-*.png` (each device frame at native size): `node docs/design/mockups/screenshot-d2.mjs` |
| `I4-imlo-screens.html` | I4 | Every Imlo screen (phone and desktop, light and dark): level map, ready card with modes, board states, the 20-tile largest board, Oson colouring, six scripts, parts, motion with reduced-motion twins, sizing and contrast tables |
| `screenshot-i4.mjs` | I4 | Regenerates `screens/I4-*.png`: `node docs/design/mockups/screenshot-i4.mjs` |

Published for review: D1 https://claude.ai/artifact/5znuW6aHUn9NkYXe9MfLzP · D2 https://claude.ai/artifact/GneG7ZrPFZ1nCyaBfBhb2G · I4 https://claude.ai/artifact/2AN25RgzmLzxFuQwA5tdfe

The HTML files have no `<html>`/`<head>` wrapper, because the Artifact host adds one. `screenshot.mjs` and `screenshot-d2.mjs` add the same wrapper locally.

`docs/design/frames.json` maps each app screen state (`e2e/states.ts`) to these frames. `npm run shots` puts the app
next to them in `shots/compare.html` (see the `e2e-visual-check` skill). A new game's design task adds its frames there.
