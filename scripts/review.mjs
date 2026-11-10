#!/usr/bin/env node
// Review shots: viewport-sized slices of a page with deferred rendering switched
// off, so every band is painted. Usage: node scripts/review.mjs <baseURL> <path> <width> <outPrefix>
import { chromium } from 'playwright';
const [base, path = '/', width = '1440', out = '.review/slice'] = process.argv.slice(2);
const w = Number(width);
const h = w < 600 ? 1500 : 1200;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', bypassCSP: true })).newPage();
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '.cv-auto{content-visibility:visible!important}.site-header{position:static!important}.split .head{position:static!important}#twin-launch{display:none!important}' });
const total = await page.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
for (let y = 0; y < total; y += h, i++) {
  await page.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.png`, clip: { x: 0, y, width: w, height: Math.min(h, total - y) }, fullPage: true });
}
await browser.close();
console.log(`${i} slices, page height ${total}px`);
