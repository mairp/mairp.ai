// Extra US1 checks: hotspot hover/press (T059), static merge (T040),
// portrait FOV/short labels (T032), payload fetch failure (T066).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const out = (k, v) => console.log(`[${k}] ${v}`);
const fail = (m) => { console.error('FAIL: ' + m); process.exitCode = 1; };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
const booted = (p) => p.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 });
// camera-controls is deferred past scene-ready (US4 T089): when its chunk
// arrives the camera re-frames to the entry shot. Wait until the camera has
// stopped moving so hotspot screen-space coordinates are stable.
const camSettled = (p) => p.evaluate(() => new Promise((res) => {
  let last = document.body.dataset.cameraPos;
  let still = 0;
  const iv = setInterval(() => {
    const cur = document.body.dataset.cameraPos;
    if (cur && cur === last) still += 1;
    else { still = 0; last = cur; }
    if (still >= 3) { clearInterval(iv); res(true); }
  }, 400);
  setTimeout(() => { clearInterval(iv); res(false); }, 15000);
}));

// ── hover/press + merge ──
{
  const page = await (await browser.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await booted(page);
  await camSettled(page);
  await page.waitForTimeout(1500);
  out('merge-stats', await page.evaluate(() => document.body.dataset.mergeStats));
  let hit = null;
  const nBtns = (await page.$$('.room3d-shots button')).length;
  for (let i = 0; i < nBtns && !hit; i++) {
    await (await page.$$('.room3d-shots button'))[i].evaluate((b) => b.click());
    await page.waitForTimeout(1800);
    const px = await page.evaluate(() => document.body.dataset.hotspotPxnavabout);
    const [hx, hy] = px.split(',').map(Number);
    if (hx < 10 || hx > 1430 || hy < 10 || hy > 890) continue;
    const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [hx, hy]);
    if (top !== 'CANVAS') continue;
    await page.mouse.move(hx, hy);
    await page.waitForTimeout(400);
    if (await page.evaluate(() => document.body.dataset.hotspotHover)) hit = { shot: i, x: hx, y: hy };
  }
  out('hotspot-hover-found', JSON.stringify(hit));
  if (!hit) fail('no hotspot hovered in grid sweep');
  else {
    out('cursor-on-hover', await page.evaluate(() => document.body.style.cursor));
    if ((await page.evaluate(() => document.body.style.cursor)) !== 'pointer') fail('cursor not pointer');
    await page.mouse.down();
    await page.waitForTimeout(200);
    const pressed = await page.evaluate(() => document.body.dataset.hotspotPress);
    out('press-flag-down', pressed);
    if (!pressed) fail('press flag not set on pointerdown');
    await page.mouse.up();
    await page.waitForTimeout(100);
    out('press-flag-up', await page.evaluate(() => document.body.dataset.hotspotPress ?? 'cleared'));
    if (await page.evaluate(() => document.body.dataset.hotspotPress)) fail('press flag stuck');
    await page.mouse.move(2, 2);
    await page.waitForTimeout(100);
    out('cursor-after-out', JSON.stringify(await page.evaluate(() => document.body.style.cursor)));
  }
  await page.close();
}
// ── portrait ──
{
  const page = await (await browser.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await booted(page);
  await camSettled(page);
  const labels = await page.$$eval('.room3d-shots button', (b) => b.map((x) => x.textContent));
  out('portrait-shot-labels', JSON.stringify(labels));
  const fov = await page.evaluate(() => document.body.dataset.cameraFov);
  out('portrait-fov', fov);
  await page.close();
  const d = await (await browser.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
  await d.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await booted(d);
  await camSettled(d);
  await d.waitForTimeout(800);
  out('desktop-fov', await d.evaluate(() => document.body.dataset.cameraFov));
  await d.close();
}
// ── payload fetch failure ──
{
  const page = await (await browser.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
  await page.route('**/rooms/home.json', (r) => r.abort());
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  // The 3D mount is deferred LOAD_SETTLE_MS (6 s) after `load` (US4 T089), so
  // the payload fetch and its boot.fail() fallback land well after 6 s — wait
  // for the overlay to go instead of a fixed sleep.
  await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 25000 }).catch(() => {});
  const s = await page.evaluate(() => ({ boot: !!document.getElementById('boot'), h1: document.querySelector('main h1')?.textContent?.trim().slice(0, 50), canvas: !!document.querySelector('.room3d-canvas canvas') }));
  out('fetch-fail', JSON.stringify(s));
  if (s.boot || !s.h1) fail('fetch failure did not fall back to flat page');
  await page.close();
}
await browser.close();
console.log(process.exitCode ? 'EXTRAS: FAILURES' : 'EXTRAS: OK');
