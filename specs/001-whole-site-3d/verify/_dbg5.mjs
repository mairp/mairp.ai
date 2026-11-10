import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4399';
const b = await chromium.launch({ args: ['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
page.on('console', m => { const t = m.text(); if (!/GL Driver|CONTEXT_LOST/.test(t)) console.log('c:', t.slice(0,200)); });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 60000 });
const info = await page.evaluate(() => ({
  canvases: [...document.querySelectorAll('canvas')].map(c => ({ w: c.width, h: c.height, cls: c.className, parent: c.parentElement?.className })),
}));
console.log(JSON.stringify(info));
await page.waitForTimeout(1500);
const px = await page.evaluate(() => document.body.dataset.hotspotPxnavabout);
console.log('px', px);
const [hx, hy] = px.split(',').map(Number);
await page.mouse.move(hx, hy); await page.waitForTimeout(400);
// dispatch raw pointerdown and see which R3F object receives it
const res = await page.evaluate(([x,y]) => {
  const c = document.querySelector('.room3d-canvas canvas');
  const ev = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true });
  c.dispatchEvent(ev);
  return { press: document.body.dataset.hotspotPress, prevented: ev.defaultPrevented };
}, [hx, hy]);
console.log('raw-dispatch', JSON.stringify(res));
await b.close();
