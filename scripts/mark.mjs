// The mark: a three-node fabric path whose final node carries the verification
// check, on a cobalt tile. Pure shapes so gen-og.mjs can rasterise it at any size.
export const COBALT = '#2742f5';
export const YELLOW = '#ffd12e';
export const INK = '#0b1230';
const FG = '#ffffff';

/** SVG fragment of the mark's lines and nodes. (x, y) = top-left, s = size. */
export function markSvg(x, y, s, { check = true } = {}) {
  const r = s * 0.1;
  const n1 = [x + s * 0.1, y + s * 0.76];
  const n2 = [x + s * 0.42, y + s * 0.3];
  const n3 = [x + s * 0.8, y + s * 0.64];
  const seg = (a, b) =>
    `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${FG}" stroke-width="${s * 0.07}" stroke-linecap="round" />`;
  const node = (p, fill, k = 1) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r * k}" fill="${fill}" />`;
  const chk = check
    ? `<polyline points="${n3[0] - r * 0.75},${n3[1] + r * 0.05} ${n3[0] - r * 0.15},${n3[1] + r * 0.62} ${n3[0] + r * 0.85},${n3[1] - r * 0.6}" fill="none" stroke="${INK}" stroke-width="${s * 0.06}" stroke-linecap="round" stroke-linejoin="round" />`
    : '';
  return `${seg(n1, n2)}${seg(n2, n3)}${node(n1, FG)}${node(n2, FG)}${node(n3, YELLOW, 1.7)}${chk}`;
}

/** The mark on its cobalt tile, as a complete SVG of `size` px. */
export function tileSvg(size) {
  const pad = size * 0.16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * 0.24}" fill="${COBALT}" />${markSvg(pad, pad, size - pad * 2)}</svg>`;
}
