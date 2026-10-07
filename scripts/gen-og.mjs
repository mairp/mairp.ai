#!/usr/bin/env node
// Generates the social card (public/og.png, 1200×630), the Apple touch icon,
// favicon.ico and favicon.svg from the practice mark, in the site's dark theme.
// Fonts are the committed JetBrains Mono subsets in scripts/assets (OFL).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { markSvg } from './mark.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fonts = ['Regular', 'Bold'].map((w) => join(root, `scripts/assets/JetBrainsMonoNL-${w}.ttf`));
const C = { bg: '#0f1512', fg: '#ffffff', text: '#d2ddd8', muted: '#93a5a0', accent: '#00b3a4', cyan: '#22d3ee', ok: '#4ade80', border: '#2c3a35' };

function png(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'JetBrains Mono NL' },
  }).render().asPng();
}

// dot grid: quiet, manual (no pattern support needed)
const dots = [];
for (let y = 24; y < 630; y += 24) {
  for (let x = 24; x < 1200; x += 24) {
    dots.push(`<circle cx="${x}" cy="${y}" r="1" fill="rgba(220,255,250,0.07)" />`);
  }
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${C.bg}" />
  ${dots.join('')}
  <ellipse cx="600" cy="700" rx="620" ry="260" fill="url(#orb)" opacity="0.5" />
  <defs><radialGradient id="orb"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.5"/><stop offset="0.5" stop-color="${C.accent}" stop-opacity="0.12"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></radialGradient></defs>
  <rect x="24" y="24" width="1152" height="582" rx="14" fill="none" stroke="${C.border}" stroke-width="2" />
  <g font-family="JetBrains Mono NL">
    <text x="80" y="104" font-size="22" fill="${C.accent}">NETWORK &amp; AI SYSTEMS CONSULTING · ABU DHABI · EN/ES/PT</text>
    ${markSvg(78, 150, 96)}
    <text x="220" y="212" font-size="72" font-weight="700" fill="${C.fg}">Marlon Paz</text>
    <text x="80" y="330" font-size="40" fill="${C.fg}">Networks that verify themselves.</text>
    <text x="80" y="382" font-size="32" fill="${C.text}">AI you can run on your own GPUs.</text>
    <text x="80" y="452" font-size="26" fill="${C.muted}">multivendor automation · agentic netops · sovereign inference</text>
    <text x="80" y="526" font-size="26" xml:space="preserve"><tspan fill="${C.ok}">intent ✓    verified ✓    costed ✓</tspan><tspan fill="${C.accent}">    · on the device, or it didn't happen</tspan></text>
    <text x="80" y="570" font-size="24" fill="${C.muted}">Cisco · Nokia · Juniper · loadbalancer.org · NVIDIA · Red Hat · SONiC</text>
    <text x="1120" y="580" font-size="26" fill="${C.text}" text-anchor="end">mairp.ai</text>
  </g>
</svg>`;
writeFileSync(join(root, 'public/og.png'), png(og, 1200));

// ── icons: the mark on the dark background ─────────────────────────────────
function icon(size) {
  const pad = size * 0.14;
  const s = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${C.bg}" />${markSvg(pad, pad, s)}</svg>`;
}
writeFileSync(join(root, 'public/apple-touch-icon.png'), png(icon(180), 180));

// favicon.ico: one 32×32 PNG wrapped in an ICO header
const p32 = png(icon(32), 32);
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(p32.length, 14); ico.writeUInt32LE(22, 18);
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([ico, p32]));

// favicon.svg: the mark standalone
writeFileSync(join(root, 'public/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${markSvg(2, 2, 28)}</svg>`);

console.log('gen-og: public/og.png, apple-touch-icon.png, favicon.ico, favicon.svg');
