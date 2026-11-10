import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:4399', localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
page.on('console', m => console.log('c:', m.text().slice(0,150)));
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto('http://localhost:4399/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 40000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const c = document.querySelector('.room3d-canvas canvas');
  ['pointerdown','pointerup'].forEach(t => {
    c.addEventListener(t, () => console.log('native-canvas', t), { capture: false });
    document.addEventListener(t, () => console.log('doc', t, 'target', event?.target?.tagName), true);
  });
});
for (let i = 0; i < 8; i++) {
  const px = await page.evaluate(() => document.body.dataset.hotspotPxnavabout);
  const [hx, hy] = px.split(',').map(Number);
  if (hx > 10 && hx < 1430 && hy > 10 && hy < 890) {
    await page.mouse.move(hx, hy); await page.waitForTimeout(500);
    console.log('hover', await page.evaluate(() => document.body.dataset.hotspotHover), 'eFromPoint', await page.evaluate(([x,y]) => document.elementFromPoint(x,y)?.tagName, [hx,hy]));
    await page.mouse.down(); await page.waitForTimeout(300);
    console.log('press', await page.evaluate(() => document.body.dataset.hotspotPress));
    await page.mouse.up(); break;
  }
  await (await page.$$('.room3d-shots button'))[i].evaluate(b => b.click());
  await page.waitForTimeout(1500);
}
await b.close();
