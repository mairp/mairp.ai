import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4398';
const b = await chromium.launch({ args: ['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
page.on('console', m => { const t = m.text(); if (!/GL Driver/.test(t)) console.log('c:', t.slice(0,400)); });
page.on('pageerror', e => console.log('PAGEERROR:', e.message, '|', (e.stack||'').split('\n').slice(1,4).join(' ')));
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 60000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 8; i++) {
  const px = await page.evaluate(() => document.body.dataset.hotspotPxnavabout);
  const [hx, hy] = px.split(',').map(Number);
  if (hx > 10 && hx < 1430 && hy > 10 && hy < 890) {
    await page.mouse.move(hx, hy); await page.waitForTimeout(500);
    await page.mouse.down(); await page.waitForTimeout(300);
    console.log('RESULT press', await page.evaluate(() => document.body.dataset.hotspotPress));
    await page.mouse.up(); break;
  }
  await (await page.$$('.room3d-shots button'))[i].evaluate(b => b.click());
  await page.waitForTimeout(1500);
}
await b.close();
