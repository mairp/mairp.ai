#!/usr/bin/env node
// Generates the social card (public/og.png, 1200×630), the Apple touch icon,
// favicon.ico and favicon.svg from the mark, in the site's cobalt identity.
// Fonts: static cuts of Bricolage Grotesque (OFL) committed in scripts/assets.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { tileSvg, COBALT, YELLOW, INK } from './mark.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fonts = ['Bold', 'Medium'].map((w) => join(root, `scripts/assets/BricolageGrotesque-${w}.ttf`));
const BOLD = 'Bricolage OG Bold';
const MEDIUM = 'Bricolage OG Medium';

function png(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: MEDIUM },
  }).render().asPng();
}

// The fabric from the hero, at rest: two spines, two leaves, both verified.
const fabric = (() => {
  const line = (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" />`;
  const box = (x, y) => `<rect x="${x}" y="${y}" width="120" height="56" rx="16" fill="${COBALT}" stroke="#fff" stroke-width="4" />`;
  const chk = (x, y) => `<circle cx="${x}" cy="${y}" r="20" fill="${YELLOW}" /><path d="M${x - 9} ${y + 1}l6.500 6.500 11.500-14" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />`;
  return `<g transform="translate(800 120)">
    ${line('M60 56V200M60 56L280 200M280 56L60 200M280 56V200')}
    ${line('M60 256L10 330M60 256L110 330M280 256L230 330M280 256L330 330')}
    ${box(0, 0)}${box(220, 0)}${box(0, 200)}${box(220, 200)}
    ${[10, 110, 230, 330].map((x) => `<circle cx="${x}" cy="348" r="18" fill="${COBALT}" stroke="#fff" stroke-width="4" />`).join('')}
    ${chk(120, 200)}${chk(340, 200)}
  </g>`;
})();

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${COBALT}" />
  <text x="70" y="250" font-family="${BOLD}" font-size="190" letter-spacing="-8" fill="#fff">Marlon</text>
  <text x="70" y="410" font-family="${BOLD}" font-size="190" letter-spacing="-8" fill="#fff">Paz</text>
  <text x="76" y="492" font-family="${MEDIUM}" font-size="31" fill="#fff">I build networks that prove their own changes,</text>
  <text x="76" y="534" font-family="${MEDIUM}" font-size="31" fill="#fff">and AI that runs on your own GPUs.</text>
  <text x="76" y="590" font-family="${MEDIUM}" font-size="24" fill="#d3daff">Network and AI infrastructure architect, Abu Dhabi</text>
  <text x="1130" y="590" font-family="${BOLD}" font-size="28" fill="${YELLOW}" text-anchor="end">mairp.ai</text>
  ${fabric}
</svg>`;
writeFileSync(join(root, 'public/og.png'), png(og, 1200));

writeFileSync(join(root, 'public/apple-touch-icon.png'), png(tileSvg(180).replace(/rx="[^"]+"/, 'rx="0"'), 180));

// favicon.ico: one 32×32 PNG wrapped in an ICO header
const p32 = png(tileSvg(32), 32);
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(p32.length, 14); ico.writeUInt32LE(22, 18);
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([ico, p32]));

writeFileSync(join(root, 'public/favicon.svg'), tileSvg(32));

console.log('gen-og: public/og.png, apple-touch-icon.png, favicon.ico, favicon.svg');
