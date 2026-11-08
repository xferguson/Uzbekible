// WCAG 2.x contrast check for the D1 palette. Run: node docs/design/mockups/contrast.mjs
// Exits 1 if any pair falls below its required ratio.
export const tokens = {
  light: {
    ground: '#F7F4EC', surface: '#FFFFFF', cobalt: '#1B3F8F', 'cobalt-deep': '#0F2A66',
    turquoise: '#1FA3B5', 'turquoise-pale': '#CDEFF2', gold: '#B08423', ochre: '#B5652B', // gold: brief #C99A2E was 2.58:1 on white
    'on-cobalt': '#FFFFFF', 'on-deep': '#FFFFFF',
    crack: '#7A2E2E', text: '#13213F', 'text-muted': '#4B5878',
    'on-gold': '#0A1838', // D2: text on gold and turquoise fills
    'cobalt-pale': '#DCE5F7', 'glaze-tint': '#EEF6F8', // I4: Uzbek-tinted letters (Oson), active row fill
  },
  dark: {
    ground: '#0B1A3A', surface: '#12254D', cobalt: '#5B86E8', 'cobalt-deep': '#0A1838', // cobalt: brief #3E6BD6
    turquoise: '#34C3D3', 'turquoise-pale': '#164A57', gold: '#E2B54C', ochre: '#D88A4E',
    'on-cobalt': '#0A1838', 'on-deep': '#EEF2FA',
    crack: '#E08A8A', text: '#EEF2FA', 'text-muted': '#A8B4CF',
    'on-gold': '#0A1838',
    'cobalt-pale': '#1F3A78', 'glaze-tint': '#16305F',
  },
};
// [foreground, background, minimum ratio, use]
export const pairs = [
  ['text', 'ground', 4.5, 'body text on page'],
  ['text', 'surface', 4.5, 'tile / card text'],
  ['text', 'turquoise-pale', 4.5, 'selected tile text'],
  ['text-muted', 'ground', 4.5, 'secondary text on page'],
  ['text-muted', 'surface', 4.5, 'secondary text on card'],
  ['cobalt', 'surface', 3, 'tile border, links, large text'],
  ['cobalt', 'ground', 3, 'icons, large text on page'],
  ['crack', 'surface', 3, 'crack lines (graphic)'],
  ['gold', 'cobalt-deep', 3, 'stars / score on header'],
  ['gold', 'surface', 3, 'selected border (graphic)'],
  ['turquoise', 'surface', 3, 'match glow, success ring'],
  ['ochre', 'surface', 3, 'warning accents'],
  ['gold', 'ground', 3, 'stars on page (graphic)'],
  ['on-cobalt', 'cobalt', 4.5, 'primary button label'],
  ['on-deep', 'cobalt-deep', 4.5, 'header / dark-panel text'],
  // D2 additions
  ['on-gold', 'gold', 4.5, 'level badge, combo pill, new-best ribbon'],
  ['on-gold', 'turquoise', 4.5, 'number on a 2-star map cell'],
  // I4 additions
  ['text', 'cobalt-pale', 4.5, 'Uzbek-tinted letter (Oson)'],
  ['cobalt', 'cobalt-pale', 3, 'its double edge'],
  ['text', 'glaze-tint', 4.5, 'letter on an active row'],
  ['gold', 'glaze-tint', 3, 'active / correct row border'],
  ['crack', 'ground', 3, 'wrong-row edge and cracks'],
  // J4 additions
  ['ochre', 'ground', 3, 'urgent timer segments (Soxta)'],
];
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
if (import.meta.url === `file://${process.argv[1]}`) {
  let fail = 0;
  for (const theme of ['light', 'dark']) {
    for (const [fg, bg, min, use] of pairs) {
      const r = ratio(tokens[theme][fg], tokens[theme][bg]);
      const ok = r >= min;
      if (!ok) fail++;
      console.log(`${theme.padEnd(5)} ${fg.padEnd(14)} on ${bg.padEnd(14)} ${r.toFixed(2).padStart(5)}:1  min ${min}  ${ok ? 'pass' : 'FAIL'}  ${use}`);
    }
  }
  process.exit(fail ? 1 : 0);
}
