/**
 * link-check.mjs — US5 T094 validation script (SC-006 spot-check).
 *
 * Loads src/content/proof.yaml, extracts every `url:` entry, issues a HEAD
 * request (falling back to GET when HEAD is not allowed) and prints one
 * status line per URL. Exit code 1 if any URL does not answer 2xx/3xx.
 *
 * Run: node specs/001-whole-site-3d/link-check.mjs
 */
import { readFileSync } from 'node:fs';

const yaml = readFileSync(new URL('../../src/content/proof.yaml', import.meta.url), 'utf8');
const urls = [...yaml.matchAll(/^\s*url:\s*(\S+)\s*$/gm)].map((m) => m[1]);

if (urls.length === 0) {
  console.error('no urls found in proof.yaml');
  process.exit(1);
}

let fail = false;
for (const url of urls) {
  let status = 'ERR';
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.status === 405 || res.status === 501)
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
    status = `${res.status} ${res.statusText || ''}`.trim();
    if (!(res.status >= 200 && res.status < 400)) fail = true;
  } catch (e) {
    status = `ERR ${e.cause?.code ?? e.message}`;
    fail = true;
  }
  console.log(`${status.padEnd(12)} ${url}`);
}
process.exit(fail ? 1 : 0);
