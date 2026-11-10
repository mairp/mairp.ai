// US4 T089: Lighthouse (same default mobile settings/thresholds as lighthouserc.json) with 3D FORCED ON:
// localStorage room3d=3d is preseeded via puppeteer so the software-renderer probe does not divert to flat.
// FORCE_3D=0 reproduces the probe-governed (flat on GPU-less runner) run. Usage: BASE=... node us4-lhci-3d.mjs
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';
const BASE = process.env.BASE || 'http://localhost:4399';
const FORCE = process.env.FORCE_3D !== '0';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const p of (process.env.PATHS ? process.env.PATHS.split(',') : ['/', '/services/svc-agentic-netops/', '/about/'])) {
  const page = await browser.newPage();
  if (FORCE) await page.evaluateOnNewDocument(() => { try { localStorage.setItem('room3d', '3d'); } catch {} });
  const r = await lighthouse(BASE + p, { output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], disableStorageReset: true }, undefined, page);
  const c = r.lhr.categories, a = r.lhr.audits;
  const reqs = a['network-requests'].details.items.map((i) => new URL(i.url).pathname.split('/').pop()).filter((n) => /^(three|mount|Effects|client)\./.test(n));
  console.log(p, FORCE ? '[3D forced]' : '[probe]', 'perf', c.performance.score, 'a11y', c.accessibility.score, 'bp', c['best-practices'].score, 'seo', c.seo.score,
    '| FCP', Math.round(a['first-contentful-paint'].numericValue), 'LCP', Math.round(a['largest-contentful-paint'].numericValue), 'TBT', Math.round(a['total-blocking-time'].numericValue), 'CLS', a['cumulative-layout-shift'].numericValue.toFixed(3), '| 3d chunks loaded:', reqs.join(',') || 'none');
  await page.close();
}
await browser.close();
