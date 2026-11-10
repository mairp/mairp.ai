/**
 * wcag-contrast.mjs — US5 T094 validation script.
 *
 * Parses src/styles/tokens.css, extracts the colour tokens for BOTH themes
 * (:root = dark, [data-theme="light"] / media light block), and prints WCAG
 * 2.x contrast ratios for the pairs the 3D island + UI rely on:
 *   fg/bg, accent/bg, accent-2/bg, accent/surface.
 * Exit code 1 if any pair is below 4.5:1 (WCAG AA for normal text).
 *
 * Run: node specs/001-whole-site-3d/wcag-contrast.mjs
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

/** Pull `--name: value` declarations out of a CSS block. */
function tokensFromBlock(block) {
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)) out[m[1]] = m[2];
  return out;
}

function hexToRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Split the stylesheet into blocks and classify them by theme.
const dark = {};
const light = {};
const blockRe = /([^{}]*)\{([^{}]*)\}/g;
let m;
while ((m = blockRe.exec(css))) {
  const [selector, body] = [m[1], m[2]];
  const t = tokensFromBlock(body);
  // Light: explicit override selectors only (NOT free text like a leading
  // comment that merely mentions "light"). Dark: the bare :root block.
  if (/prefers-color-scheme:\s*light/.test(selector) || /data-theme\s*=\s*['"]?light/.test(selector))
    Object.assign(light, t);
  else if (selector.trim().endsWith(':root')) Object.assign(dark, t);
}

const PAIRS = [
  ['fg', 'bg'],
  ['accent', 'bg'],
  ['accent-2', 'bg'],
  ['accent', 'surface'],
];

let fail = false;
for (const [theme, t] of [['dark', dark], ['light', light]]) {
  for (const [fg, bg] of PAIRS) {
    if (!t[fg] || !t[bg]) {
      console.error(`${theme}: missing token --${fg} or --${bg}`);
      fail = true;
      continue;
    }
    const ratio = contrast(t[fg], t[bg]);
    const ok = ratio >= 4.5;
    if (!ok) fail = true;
    console.log(
      `${theme.padEnd(5)} ${fg}/${bg}`.padEnd(26) +
        `${t[fg]} on ${t[bg]}  ratio ${ratio.toFixed(2)}:1  ${ok ? 'PASS (AA)' : 'FAIL'}`,
    );
  }
}
process.exit(fail ? 1 : 0);
