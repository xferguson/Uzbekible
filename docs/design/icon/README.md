# D3: PWA icon set

The final app icon is **concept A, the pure star**, as approved in D1 (`docs/design/brief.md`, "Approved decisions"):
an 8-point {8/2} khatam star in cobalt `#1B3F8F` with a {8/3} turquoise `#1FA3B5` interlace and a gold `#C99A2E`
octagon centre, on glaze white `#F7F4EC`.

## Source and build
- Geometry and file list: `scripts/icons/icons.ts` (pure, unit-tested in `icons.test.ts`).
  It is hand-built from the D1 mockup's star function because `core/motif` (K9) hasn't merged yet. When K9 lands,
  switch `starOutline` and the interlace and octagon helpers to `core/motif`. The committed-file tests catch any drift.
- `npm run icons:build` writes everything into `public/` with Chromium (Playwright). Don't edit the outputs by hand.
- `node docs/design/icon/screenshot.mjs` regenerates the screenshots in `screens/`.

## Variants
| Variant | Star radius (of 512) | Used for |
|---|---|---|
| `any` | 212 | `icons/icon.svg` (master), `icon-{48,72,96,144,192,512}.png` |
| `maskable` | 190, inside the 204.8 safe zone | `icons/icon-maskable.svg`, `icon-maskable-{192,512}.png`, `icons/apple-touch-icon.png` (180) |
| `favicon` | 236, no interlace, larger centre | `favicon.svg`, `favicon.ico` (16/32/48) |

The `any` star is larger than the approved mockup (190) so the icon fills the square on platforms that don't mask it.
The maskable icon keeps the approved proportions. The favicon drops the hairline interlace, which turns to mush at 16 px.
iOS ignores the manifest and fills any transparency with black, so `apple-touch-icon` uses the padded, opaque maskable artwork.

## Wiring
- Manifest `icons` come from `manifestIcons()` (`vite.config.ts`).
- `index.html` links `favicon.ico`, `favicon.svg` and `apple-touch-icon`. Vite adds the `/Uzbekible/` base.

## Screens
- `screens/D3-icon-set.png`: every size, the safe zone, and circle, squircle and rounded masks
- `screens/D3-home-{android,ios}-{light,dark}.png`: mock home screens at 390×844, deviceScaleFactor 2
