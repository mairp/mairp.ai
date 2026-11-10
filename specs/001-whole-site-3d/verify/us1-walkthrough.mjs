import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4321';
const out = (k, v) => console.log(`[${k}] ${v}`);
const fail = (m) => { console.error('FAIL: ' + m); process.exitCode = 1; };

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// ── 1. Boot the home room ────────────────────────────────────────────────
const t0 = Date.now();
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#boot');
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 });
const bootMs = Date.now() - t0;
out('boot-ms', bootMs);
if (bootMs > 20000) fail(`boot ${bootMs}ms exceeds 20s ceiling`);
const canvas = await page.$('.room3d-canvas canvas');
out('canvas', canvas ? 'mounted' : 'MISSING');
if (!canvas) fail('no canvas mounted');

// WebGL layer + CSS3D screens present
// FR-003 / T067: progressive mounting — sample at boot-hide, then ~1.5 s later.
const countAtHide = await page.$$eval('.rs-screen', (els) => els.length);
const tFull = Date.now();
await page.waitForFunction(() => document.querySelectorAll('.rs-screen').length >= 10, null, { timeout: 8000 }).catch(() => {});
out('full-set-after-ms', Date.now() - tFull);
const screenCount = await page.$$eval('.rs-screen', (els) => els.length);
out('css3d-screens-at-hide', countAtHide);
out('css3d-screens', screenCount);
if (!(countAtHide < screenCount)) fail(`screens not progressive: at-hide ${countAtHide}, later ${screenCount}`);
if (countAtHide < 1) fail('no priority screen present at boot-hide');

// T063: only the canvas container is aria-hidden; screens/controls are not.
const aria = await page.evaluate(() => {
  const hiddenAncestor = (el) => !!el.closest('[aria-hidden="true"]');
  const s = document.querySelector('.rs-screen');
  const c = document.querySelector('.room3d-shots');
  const cv = document.querySelector('.room3d-canvas');
  return { screen: s && hiddenAncestor(s), shots: c && hiddenAncestor(c), canvas: cv && cv.getAttribute('aria-hidden') };
});
out('aria', JSON.stringify(aria));
if (aria.screen !== false || aria.shots !== false || aria.canvas !== 'true') fail('aria-hidden placement wrong');
if (screenCount < 8) fail(`expected >=8 home screens, got ${screenCount}`);

// hero content readable in-world (payload-sourced)
const heroText = await page.$eval('.rs-screen[data-content="hero"]', (el) => el.textContent);
out('hero-snippet', heroText.slice(0, 90));
if (!/Marlon|network|infrastructure|Consulting/i.test(heroText)) fail('hero screen lacks payload content');

// flat content still present beneath
const flatH1 = await page.$eval('main h1', (el) => el.textContent.trim());
out('flat-h1', flatH1.slice(0, 60));

// ── 2. Navigate to the services area (single interaction) ───────────────
await page.click('.room3d-shots button:has-text("Services")');
await page.waitForTimeout(1200); // camera tween
const gridVisible = await page.$eval(
  '.rs-screen[data-content="servicesGrid"]',
  (el) => ({ items: el.querySelectorAll('.rs-grid-item').length, text: el.textContent.slice(0, 60) }),
);
out('services-grid', JSON.stringify(gridVisible));
if (gridVisible.items !== 7) fail(`expected 7 service rows, got ${gridVisible.items}`);

// ── 3. Click a specific service row → persistent-session navigation ─────
await page.click('.rs-grid-item:has-text("Agentic")');
await page.waitForFunction(() => location.pathname === '/services/svc-agentic-netops/', null, { timeout: 10000 });
out('url-after-nav', page.url());
const title1 = await page.title();
out('title-after-nav', title1);
const canon = await page.$eval('link[rel="canonical"]', (el) => el.href);
out('canonical', canon);
if (!/Agentic|Net/i.test(title1)) fail('document title did not sync to the service');
// no page reload: the island must not have re-booted
const stillNoBoot = await page.$('#boot');
out('boot-removed-after-nav', stillNoBoot ? 'REBOOTED (bad)' : 'no re-boot (persistent session)');
if (stillNoBoot) fail('3D world re-booted on navigation');

// service detail screens readable
await page.waitForTimeout(900);
const detail = await page.$eval('.rs-screen[data-content="serviceDetail"]', (el) => el.textContent);
out('detail-snippet', detail.slice(0, 110));
if (!/Deliverables/.test(detail)) fail('detail screen lacks deliverables');
const evd = await page.$eval('.rs-screen[data-content="serviceEvidence"]', (el) => el.textContent);
out('evidence-snippet', evd.slice(0, 90));
const evLinks = await page.$$eval('.rs-screen[data-content="serviceEvidence"] a', (as) => as.map((a) => a.href));
out('evidence-links', JSON.stringify(evLinks.slice(0, 3)));

// ── 4. Back / forward / refresh ─────────────────────────────────────────
await page.goBack({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => location.pathname === '/', null, { timeout: 10000 });
out('back-url', page.url());
await page.goForward({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => location.pathname === '/services/svc-agentic-netops/', null, { timeout: 10000 });
out('forward-url', page.url());
if (!page.url().includes('/services/svc-agentic-netops/')) fail('forward did not return to service room');
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 });
out('refresh-url', page.url());
const detailAfterRefresh = await page.$$eval('.rs-screen', (els) => els.map((e) => e.dataset.content).join(','));
out('screens-after-refresh', detailAfterRefresh);
if (!/serviceDetail/.test(detailAfterRefresh)) fail('refresh did not reopen the service room');

// ── 5. Theme toggle affects the world ───────────────────────────────────
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('[data-theme-toggle]');
await page.waitForTimeout(300);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
out('theme', `${themeBefore} -> ${themeAfter}`);
if (themeBefore === themeAfter) fail('theme toggle did nothing');
await page.click('[data-theme-toggle]'); // restore

// ── 6. Twin trigger from the contact screen ─────────────────────────────
await page.click('.room3d-shots button:has-text("Contact")');
await page.waitForTimeout(900);
const twinBtn = await page.$('[data-twin-open]');
out('twin-launcher', twinBtn ? 'present' : 'MISSING');
if (twinBtn) {
  await page.click('.rs-screen[data-content="contact"] button:has-text("Twin")');
  await page.waitForTimeout(600);
  const twinOpen = await page.evaluate(() => {
    const el = document.querySelector('[data-twin-open]');
    return el?.getAttribute('aria-expanded') ?? document.querySelector('dialog[open], .twin-open, [data-twin-panel]') ? 'open' : 'unknown';
  });
  out('twin-state', twinOpen);
  const expanded = await page.evaluate(() => document.querySelector('[data-twin-open]')?.getAttribute('aria-expanded'));
  const panelOpen = await page.evaluate(() => !!document.querySelector('#twin-panel.open'));
  out('twin-panel-open', panelOpen);
  if (!panelOpen) fail('Twin panel did not open');
}

// ── 7. Copy email with clipboard + aria-live ────────────────────────────
const email = await page.$eval('.rs-screen[data-content="contact"] .rs-meta', (el) => el.textContent.trim());
out('email', email);
await page.click('.rs-screen[data-content="contact"] button:has-text("Copy email")');
await page.waitForTimeout(500);
const clip = await page.evaluate(() => navigator.clipboard.readText());
out('clipboard', clip);
if (clip !== email) fail(`clipboard ${clip} != ${email}`);

await page.close();
// ── 8. Deep link: fresh tab straight into /about/ ───────────────────────
const p2 = await ctx.newPage();
const t2 = Date.now();
await p2.goto(BASE + '/about/', { waitUntil: 'domcontentloaded' });
await p2.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 });
await p2.waitForFunction(() => document.querySelectorAll('.rs-screen').length >= 4, null, { timeout: 8000 }).catch(() => {});
const aboutScreens = await p2.$$eval('.rs-screen', (els) => els.map((e) => e.dataset.content).join(','));
out('about-deep-link', `${Date.now() - t2}ms screens=${aboutScreens}`);
if (aboutScreens.split(',').length !== 4) fail(`about expected 4 screens: ${aboutScreens}`);
if (!/aboutBio/.test(aboutScreens)) fail('deep link /about/ did not open the about room');

await p2.close();
// ── 9. svc-enablement requires-scoping ──────────────────────────────────
const p3 = await ctx.newPage();
await p3.goto(BASE + '/services/svc-enablement/', { waitUntil: 'domcontentloaded' });
await p3.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 30000 });
await p3.waitForFunction(() => document.querySelectorAll('.rs-screen').length >= 4, null, { timeout: 8000 }).catch(() => {});
const svcCount = await p3.$$eval('.rs-screen', (e) => e.length);
out('service-screens', svcCount);
if (svcCount !== 4) fail(`service route expected 4 screens, got ${svcCount}`);
const status = await p3.$eval('.rs-screen[data-content="serviceDetail"]', (el) => el.textContent);
out('enablement-status', /Requires scoping/.test(status) ? 'shows requires-scoping' : 'MISSING status');
if (!/Requires scoping/.test(status)) fail('svc-enablement status note missing');

// keyboard nav smoke: J/K cycle, Escape closes
await p3.keyboard.press('j');
await p3.keyboard.press('Enter');
await p3.waitForTimeout(800);
const opened = await p3.$$eval('.rs-open', (e) => e.map((x) => x.dataset.content).join(','));
out('kbd-enter-opens', opened || 'NONE');
if (!opened) fail('keyboard Enter did not open a screen');
await p3.keyboard.press('Escape');
await p3.waitForTimeout(400);
const closed = await p3.$$eval('.rs-open', (e) => e.length);
out('kbd-escape-closes', closed === 0 ? 'closed' : 'STILL OPEN');
if (closed) fail('Escape did not close');

const realErrors = errors.filter((e) => !/favicon|data:,|font-size:0|Fetch API cannot load data|Turnstile|turnstile|challenges\.cloudflare/i.test(e));
out('page-errors', realErrors.length ? JSON.stringify(realErrors) : 'none');
if (realErrors.length) fail('page errors during walkthrough');

await browser.close();
console.log(process.exitCode ? 'WALKTHROUGH: FAILURES' : 'WALKTHROUGH: OK');
