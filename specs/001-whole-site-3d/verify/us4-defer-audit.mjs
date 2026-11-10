// US4 defer-first audit (T088): request order vs primary content render, under
// 4x CPU throttling, plus lazy-doc (/api/*) fetch-on-open check.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4399';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const reqs = [];
const t0 = Date.now();
page.on('request', (r) => reqs.push({ t: Date.now() - t0, url: new URL(r.url()).pathname }));
await page.addInitScript(() => {
  try { localStorage.setItem('room3d', '3d'); } catch {}
  window.__fcp = null;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__fcp = e.startTime; })
    .observe({ type: 'paint', buffered: true });
});
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__fcp !== null);
const lcp = await page.evaluate(() => new Promise((res) => new PerformanceObserver((l) => res(l.getEntries().at(-1).startTime)).observe({ type: 'largest-contentful-paint', buffered: true })));
const sawBoot = await page.evaluate(() => !!document.getElementById('boot'));
const fcp = await page.evaluate(() => window.__fcp);
console.log('fcp-ms', Math.round(fcp), 'lcp-ms', Math.round(lcp));
console.log('boot-overlay-present-at-fcp', sawBoot);
const apiBefore = reqs.filter((r) => r.url.startsWith('/api/')).length;
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 60000 });
// The 3D mount is deferred by LOAD_SETTLE_MS after `load`, so the first 3D
// request can only be judged after the boot overlay is gone.
const first3d = reqs.find((r) => /\/(mount|three|rooms\/|.*\.glb)/.test(r.url) || /\.glb$/.test(r.url));
console.log('first-3d-request', first3d ? `${first3d.url} @${first3d.t}ms` : 'none');
console.log('api-requests-before-scene-ready', reqs.filter((r) => r.url.startsWith('/api/')).length, '(at boot-hide)');
console.log('requests:', reqs.filter((r) => /_astro|rooms|api|glb/.test(r.url)).map((r) => `${r.t}ms ${r.url}`).join('\n  '));
if (first3d && first3d.t < fcp) { console.error('FAIL: 3D request before FCP'); process.exitCode = 1; }
await browser.close();
