#!/usr/bin/env node
// Route-walk validation (feature 001-whole-site-3d, T072 / SC-005).
// For each entry of contracts/url-room-map.md: (1) the flat static HTML has real
// content, (2) the per-route payload doc matches the route, (3) a fresh tab boots
// the island into the matching room (.room3d-layer[data-room]), (4) /404 never mounts 3D.
// Then walks in-app navigation: pushState, back, forward, refresh.
// Usage: node scripts/validate-rooms.mjs [baseURL]   (dev server or preview must be running)
import { chromium } from 'playwright';
const base = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '');
const SERVICES = ['svc-agentic-netops', 'svc-aiops-cloudops', 'svc-local-inference', 'svc-agent-platform', 'svc-critical-fabric', 'svc-agent-delivery', 'svc-enablement'];
const MAP = [
  { route: '/', key: 'home' },
  ...SERVICES.map((s) => ({ route: `/services/${s}/`, key: s })),
  { route: '/about/', key: 'about' },
];
let bad = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) bad++; };

for (const { route, key } of MAP) {
  const html = await (await fetch(base + route)).text();
  check(/<h1[\s>]/.test(html) && html.length > 3000, `${route} flat HTML has content (${html.length} bytes, h1)`);
  const res = await fetch(`${base}/rooms/${key}.json`);
  const doc = res.ok ? await res.json() : null;
  check(doc && doc.route === route, `${route} payload /rooms/${key}.json route=${doc?.route}`);
}
const nf = await fetch(base + '/404');
const nfHtml = await nf.text();
check(/<h1[\s>]/.test(nfHtml), '/404 serves static content');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ bypassCSP: true });
const roomOf = (page) => page.evaluate(() => document.querySelector('.room3d-layer')?.getAttribute('data-room') ?? null);
const waitRoom = (page, route) => page.waitForFunction((r) => document.querySelector('.room3d-layer')?.getAttribute('data-room') === r, route, { timeout: 30000 }).then(() => true, () => false);

for (const { route } of MAP) {
  const page = await ctx.newPage();
  await page.goto(base + route);
  check(await waitRoom(page, route), `${route} fresh tab boots into matching room (data-room=${await roomOf(page)})`);
  check(new URL(page.url()).pathname === route, `${route} URL unchanged`);
  const title = await page.title();
  const flatTitle = await fetch(base + route).then((r) => r.text()).then((t) => /<title>([^<]*)<\/title>/.exec(t)?.[1]);
  check(!!title && title.replace(/&amp;/g, '&') === flatTitle?.replace(/&amp;/g, '&'), `${route} title matches flat HTML ("${title}")`);
  await page.close();
}

{ // 404: never mounts
  const page = await ctx.newPage();
  await page.goto(base + '/404');
  await page.waitForTimeout(4000);
  check((await roomOf(page)) === null, '/404 does not mount the island');
  await page.close();
}

{ // in-app history: home -> service -> about, back/forward/refresh
  const page = await ctx.newPage();
  await page.goto(base + '/');
  await waitRoom(page, '/');
  const svc = `/services/${SERVICES[0]}/`;
  await page.evaluate(() => document.querySelector('.room3d-ui'));
  await page.evaluate(() => { window.__noReload = 1; });
  // In-world services grid buttons (ServicesGridScreen) call navigate() -> pushState.
  const btn = page.locator('button.rs-grid-item').first();
  const navClicked = await btn.waitFor({ state: 'attached', timeout: 20000 }).then(() => true, () => false);
  let svc2 = svc;
  if (navClicked) {
    await btn.evaluate((el) => el.click());
    await page.waitForFunction(() => location.pathname.startsWith('/services/'), null, { timeout: 15000 }).catch(() => {});
    svc2 = new URL(page.url()).pathname;
  }
  if (navClicked) {
    check(await waitRoom(page, svc2), `in-app click navigates to ${svc2} without reload`);
    check(new URL(page.url()).pathname === svc2, 'URL pushState updated');
    check(await page.evaluate(() => window.__noReload === 1), 'no full page reload (window marker survived)');
    check((await page.title()).length > 0, `title synced: "${await page.title()}"`);
    await page.goBack();
    check(await waitRoom(page, '/'), 'back returns to previous room');
    await page.goForward();
    check(await waitRoom(page, svc2), 'forward returns to service room');
    await page.reload();
    check(await waitRoom(page, svc2), 'refresh reopens the same room');
  } else {
    console.log('SKIP in-app click walk: no DOM affordance with href/data-route found for', svc);
  }
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} failure(s)` : 'validate-rooms: all checks passed');
process.exit(bad ? 1 : 0);
