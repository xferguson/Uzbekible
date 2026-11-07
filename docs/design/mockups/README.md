# Design mockups

| File | Task | What |
|---|---|---|
| `D1-design-system.html` | D1 | Palette and contrast, type in six scripts, motif library, tile states, motion, icon concepts, home screen |
| `contrast.mjs` | D1 | WCAG contrast check of the palette: `node docs/design/mockups/contrast.mjs` (exit 1 on any failing pair) |
| `screenshot.mjs` | D1 | Regenerates `screens/*.png` at deviceScaleFactor 2: `node docs/design/mockups/screenshot.mjs` |

Published for review: https://claude.ai/artifact/5znuW6aHUn9NkYXe9MfLzP

The HTML files have no `<html>`/`<head>` wrapper, because the Artifact host adds one. `screenshot.mjs` adds the same wrapper locally.
