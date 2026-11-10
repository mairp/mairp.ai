import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4399';
const b = await chromium.launch({ args: ['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ storageState: { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: 'room3d', value: '3d' }] }] }, viewport: { width: 1440, height: 900 } })).newPage();
await page.addInitScript(() => {
  window.__log = [];
  const t0 = performance.now();
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...a) {
    if (String(type).includes('webgl')) window.__log.push([Math.round(performance.now() - t0), 'getContext', String(type)]);
    return orig.call(this, type, ...a);
  };
  const fc = WebGLRenderingContext.prototype;
  if (WebGL2RenderingContext && WebGL2RenderingContext.prototype.forceContextLoss) {
    const f = WebGL2RenderingContext.prototype.forceContextLoss;
    WebGL2RenderingContext.prototype.forceContextLoss = function () {
      window.__log.push([Math.round(performance.now() - t0), 'forceContextLoss']);
      return f.call(this);
    };
  }
});
page.on('console', m => { const t = m.text(); if (!/GL Driver|CONTEXT_LOST/.test(t)) console.log('c:', t.slice(0,200)); });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 60000 });
await page.waitForTimeout(1000);
console.log(JSON.stringify(await page.evaluate(() => window.__log)));
await b.close();
