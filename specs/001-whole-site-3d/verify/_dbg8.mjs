import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4399';
const b = await chromium.launch({ args: ['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
page.on('console', m => { const t = m.text(); if (/dbg|CONTEXT/.test(t)) console.log('c:', t.slice(0,120)); });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 60000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 8; i++) {
  const px = await page.evaluate(() => document.body.dataset.hotspotPxnavabout);
  const [hx, hy] = px.split(',').map(Number);
  if (hx > 10 && hx < 1430 && hy > 10 && hy < 890) {
    await page.mouse.move(hx, hy); await page.waitForTimeout(500);
    console.log('hover', await page.evaluate(() => document.body.dataset.hotspotHover));
    const px1 = await page.evaluate(() => document.body.dataset.hotspotPxnavabout);
    console.log('px-at-hover', px1);
    await page.mouse.move(hx + 1, hy); await page.waitForTimeout(300);
    console.log('hover-after-jiggle', await page.evaluate(() => document.body.dataset.hotspotHover), await page.evaluate(() => document.body.style.cursor));
    await page.mouse.down();
    for (const d of [30, 100, 200, 400]) { await page.waitForTimeout(d === 30 ? 30 : d - [30,100,200,400][[30,100,200,400].indexOf(d)-1]); console.log('t+'+d, await page.evaluate(() => document.body.dataset.hotspotPress)); }
    console.log('px-at-read', await page.evaluate(() => document.body.dataset.hotspotPxnavabout), 'cam', await page.evaluate(() => document.body.dataset.cameraPos));
    await page.mouse.up(); break;
  }
  await (await page.$$('.room3d-shots button'))[i].evaluate(b => b.click());
  await page.waitForTimeout(1500);
}
await b.close();
