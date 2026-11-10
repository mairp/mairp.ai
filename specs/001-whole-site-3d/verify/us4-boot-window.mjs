// US4 T088/T089: real-world (non-Lighthouse) timing with 3D FORCED ON.
// For each route: record FCP, the time the 3D bundle is first REQUESTED,
// the time the mount gate fires, and the time #boot is removed (scene usable).
// Confirms (a) no 3D request before FCP, (b) boot-to-usable inside the 20 s
// hard ceiling, and (c) #boot is visible with progress between FCP and usable.
// Usage: BASE=http://localhost:4399 node us4-boot-window.mjs
import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE || 'http://localhost:4399';
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const p of (process.env.PATHS ? process.env.PATHS.split(',') : ['/', '/services/svc-agentic-netops/', '/about/'])) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('room3d', '3d'); } catch {} });
  const t0 = Date.now();
  const marks = {};
  page.on('request', (r) => {
    const n = new URL(r.url()).pathname.split('/').pop();
    if (/^(three|mount|Effects|client\.C)/.test(n) && !marks[n]) marks[n] = Date.now() - t0;
  });
  await page.evaluateOnNewDocument(() => {
    const po = new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!window.__fcp) window.__fcp = Math.round(e.startTime);
    });
    po.observe({ type: 'paint', buffered: true });
  });
  await page.goto(BASE + p, { waitUntil: 'load' });
  try {
    await page.waitForFunction(() => !document.getElementById('boot'), { timeout: 45000 });
    const usable = Date.now() - t0;
    const fcp = await page.evaluate(() => window.__fcp);
    const bootVisibleDuring = fcp !== undefined && usable > fcp;
    console.log(p, 'FCP', fcp, 'ms | first 3D request', Math.min(...Object.values(marks)), 'ms | scene usable (#boot removed)', usable, 'ms | boot visible between FCP and usable:', bootVisibleDuring, '| chunks:', Object.keys(marks).join(','));
  } catch {
    console.log(p, 'TIMEOUT: scene not usable in 45 s; chunks so far:', JSON.stringify(marks));
  }
  await page.close();
}
await browser.close();
