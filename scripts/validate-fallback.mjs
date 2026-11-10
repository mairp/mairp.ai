#!/usr/bin/env node
// US3 fallback validation (feature 001-whole-site-3d, T075 + T084).
// Usage: node scripts/validate-fallback.mjs [baseURL]  (preview/dev must be running)
// Every scenario runs on every route in a fresh browser context and asserts
// zero console/page errors, except for the narrow, printed allow-lists of
// errors that the scenario itself causes on purpose.
import { chromium } from 'playwright';
const base = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '');
const ROUTES = ['/', '/services/svc-agentic-netops/', '/about/'];
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
// Deliberate-failure allow-lists (matched against console text only).
const ABORTED_FETCH = /^Failed to load resource: net::ERR_FAILED$/; // our own route.abort() on /rooms/*.json
const CONTEXT_LOST = /context.?lost|CONTEXT_LOST_WEBGL/i; // our own loseContext()
let bad = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) bad++; };
const flatOk = (page) => page.evaluate(() => !!document.querySelector('main h1') && !document.getElementById('boot') && !document.querySelector('.room3d-layer'));
const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const pos = (page) => page.evaluate(() => document.body.dataset.cameraPos?.split(',').map(Number) ?? null);

async function ctx(browser, opts = {}, init) {
  const c = await browser.newContext(opts);
  if (init) await c.addInitScript(init);
  const page = await c.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return { c, page, errors };
}

function clean(t, label, allow) {
  const ignored = allow ? t.errors.filter((e) => allow.test(e)) : [];
  const left = t.errors.filter((e) => !ignored.includes(e));
  check(left.length === 0, `${label}: console clean${ignored.length ? ` (filtered ${ignored.length} intentional: ${[...new Set(ignored)].join(' | ')})` : ''}${left.length ? ` ERRORS: ${left.join(' | ')}` : ''}`);
}

// Runs one scenario in a fresh context; a throw (e.g. timeout) becomes a FAIL line.
async function scenario(browser, label, opts, init, fn) {
  const t = await ctx(browser, opts, init);
  try { await fn(t); } catch (e) { check(false, `${label}: threw ${String(e.message).split('\n')[0]}`); }
  finally { await t.c.close(); }
}

const booted = (page) => page.waitForFunction(() => document.querySelector('.room3d-layer') && document.querySelector('.room3d-canvas canvas') && !document.getElementById('boot'), null, { timeout: 25000 });

// Click a not-yet-active shot, sample camera 2 frames later, then at rest.
async function shotMove(page) {
  await page.waitForTimeout(2500); // let the entry flight settle
  const start = await pos(page);
  await page.locator('.room3d-shots button[aria-pressed="false"]').first().click();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const early = await pos(page);
  await page.waitForTimeout(4000);
  const end = await pos(page);
  return { moved: dist(start, end), residual: dist(early, end) };
}

const browser = await chromium.launch({ args: GL });
const counts = {};
for (const r of ROUTES) {
  const before = bad;
  const startLines = [];
  const L = (s) => `${r} ${s}`;

  await scenario(browser, L('no-WebGL'), {}, () => {
    const g = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (k, ...a) { return /webgl/.test(k) ? null : g.call(this, k, ...a); };
  }, async (t) => {
    await t.page.goto(base + r); await t.page.waitForTimeout(3500);
    check(await flatOk(t.page), L('no-WebGL: flat content, #boot gone, no canvas'));
    clean(t, L('no-WebGL'));
  });

  await scenario(browser, L('JS disabled'), { javaScriptEnabled: false }, null, async (t) => {
    await t.page.goto(base + r);
    check(await t.page.evaluate(() => !!document.querySelector('main h1') && document.body.innerText.length > 1500), L('JS disabled: full static content'));
    clean(t, L('JS disabled'));
  });

  await scenario(browser, L('reduced-motion'), { reducedMotion: 'reduce' }, null, async (t) => {
    await t.page.goto(base + r);
    try { await booted(t.page); } catch { /* state asserted below */ }
    check(await t.page.evaluate(() => !!document.querySelector('.room3d-layer') && !document.getElementById('boot')), L('reduced-motion: 3D boots (.room3d-layer present, #boot gone)'));
    check(await t.page.evaluate(() => !!document.querySelector('.room3d-canvas canvas')), L('reduced-motion: canvas present'));
    const m = await shotMove(t.page);
    check(m.moved > 0.2 && m.residual <= 0.05, L(`reduced-motion: shot change is a jump cut (moved ${m.moved.toFixed(2)}, residual 2 frames after click ${m.residual.toFixed(2)} <= 0.05)`));
    clean(t, L('reduced-motion'));
  });

  // Animated baseline, then live media flip on the same page.
  await scenario(browser, L('motion baseline/flip'), {}, null, async (t) => {
    await t.page.goto(base + r);
    await booted(t.page);
    const a = await shotMove(t.page);
    check(a.moved > 0.2 && a.residual > 0.05, L(`no reduced-motion: shot change animates (moved ${a.moved.toFixed(2)}, residual 2 frames after click ${a.residual.toFixed(2)} > 0.05)`));
    await t.page.emulateMedia({ reducedMotion: 'reduce' });
    await t.page.waitForTimeout(500);
    const b = await shotMove(t.page);
    check(b.moved > 0.2 && b.residual <= 0.05, L(`live media change: after emulateMedia(reduce) shot change is a jump cut (moved ${b.moved.toFixed(2)}, residual ${b.residual.toFixed(2)} <= 0.05)`));
    clean(t, L('motion baseline/flip'));
  });

  await scenario(browser, L('payload fetch failure'), {}, null, async (t) => {
    await t.page.route('**/rooms/*.json', (rt) => rt.abort());
    await t.page.goto(base + r); await t.page.waitForTimeout(6000);
    check(await flatOk(t.page), L('payload fetch failure: lands on flat page, no stuck boot'));
    check(await t.page.evaluate(() => !!document.querySelector('#boot.failed') || !document.getElementById('boot')), L('payload fetch failure: failure surfaced cleanly (boot removed)'));
    clean(t, L('payload fetch failure'), ABORTED_FETCH);
  });

  await scenario(browser, L('decline/persist/re-enable'), {}, null, async (t) => {
    await t.page.goto(base + r);
    await t.page.click('[data-use-flat]', { timeout: 5000 });
    await t.page.waitForTimeout(1500);
    check(await flatOk(t.page), L('decline at boot: flat page, island absent'));
    check(await t.page.evaluate(() => localStorage.getItem('room3d')) === 'flat', L('decline persisted'));
    await t.page.reload(); await t.page.waitForTimeout(3500);
    check(await flatOk(t.page), L('reload stays flat'));
    check(await t.page.isVisible('[data-enable-3d]'), L('footer re-enable visible when preference set'));
    await t.page.click('[data-enable-3d]');
    check(await t.page.evaluate(() => localStorage.getItem('room3d')) === null, L('re-enable clears preference'));
    await t.page.reload();
    try { await t.page.waitForSelector('.room3d-layer', { timeout: 25000 }); } catch { /* asserted below */ }
    check(await t.page.evaluate(() => !!document.querySelector('.room3d-layer') && localStorage.getItem('room3d') === null), L('3D returns after re-enable (.room3d-layer present, localStorage.room3d null)'));
    check(await t.page.evaluate(() => document.getElementById('flat-reenable').hidden), L('footer re-enable hidden when preference unset'));
    await booted(t.page);
    await t.page.click('.room3d-flat-btn');
    await t.page.waitForTimeout(800);
    check(await flatOk(t.page), L('in-session decline: island unmounted, flat page'));
    check(await t.page.evaluate(() => localStorage.getItem('room3d')) === 'flat', L('in-session decline persisted'));
    clean(t, L('decline/persist/re-enable'));
  });

  await scenario(browser, L('lite'), {}, () => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }), async (t) => {
    await t.page.goto(base + r);
    await t.page.waitForSelector('.room3d-layer[data-lite="true"]', { timeout: 25000 });
    await booted(t.page);
    check(await t.page.evaluate(() => document.querySelector('canvas').width <= innerWidth), L('lite: dpr 1 (canvas width <= viewport)'));
    clean(t, L('lite'));
  });

  await scenario(browser, L('context loss'), {}, null, async (t) => {
    await t.page.goto(base + r);
    await booted(t.page);
    await t.page.evaluate(() => {
      const gl = document.querySelector('.room3d-canvas canvas').getContext('webgl2');
      gl.getExtension('WEBGL_lose_context').loseContext();
    });
    await t.page.waitForTimeout(1000);
    check(await t.page.evaluate(() => !document.querySelector('.room3d-layer') && !!document.querySelector('main h1')), L('context loss: canvas layer dropped, flat page intact'));
    clean(t, L('context loss'), CONTEXT_LOST);
  });

  counts[r] = { fail: bad - before };
}

await browser.close();
for (const r of ROUTES) console.log(`route ${r}: ${counts[r].fail} FAIL`);
console.log(bad ? `validate-fallback: ${bad} FAILED` : 'validate-fallback: all checks passed');
process.exit(bad ? 1 : 0);
