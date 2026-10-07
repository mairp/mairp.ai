// The practice mark: a three-node fabric path whose final node carries the
// verification check — "intent in, evidence out" as geometry. Pure shapes so
// gen-og.mjs can rasterise it at any size.
const FG = '#ffffff';
const ACCENT = '#00b3a4';
const CYAN = '#22d3ee';

/** SVG fragment of the mark. (x, y) = top-left of its bounding box, s = size. */
export function markSvg(x, y, s, { check = true } = {}) {
  const r = s * 0.09; // node radius
  const n1 = [x + s * 0.08, y + s * 0.78];
  const n2 = [x + s * 0.42, y + s * 0.30];
  const n3 = [x + s * 0.80, y + s * 0.66];
  const seg = (a, b, c) =>
    `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${s * 0.055}" stroke-linecap="round" />`;
  const node = (p, fill) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${fill}" />`;
  const glow = (p) =>
    `<circle cx="${p[0]}" cy="${p[1]}" r="${r * 2.2}" fill="url(#markGlow)" />`;
  const chk = check
    ? `<polyline points="${n3[0] - r * 0.52},${n3[1]} ${n3[0] - r * 0.1},${n3[1] + r * 0.42} ${n3[0] + r * 0.62},${n3[1] - r * 0.46}" fill="none" stroke="${FG}" stroke-width="${s * 0.05}" stroke-linecap="round" stroke-linejoin="round" />`
    : '';
  return `<defs><radialGradient id="markGlow"><stop offset="0" stop-color="${CYAN}" stop-opacity="0.5"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient></defs>
${seg(n1, n2, '#5c8f88')}${seg(n2, n3, ACCENT)}
${node(n1, '#9fb8b2')}${node(n2, FG)}${glow(n3)}${node(n3, ACCENT)}${chk}`;
}
