import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { parseHTML } from 'linkedom';
const root = resolve('site');
const origin = 'https://eurorack.epsilonrecords.com';
const external = new Set();
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(resolve(dir, e.name)) : resolve(dir, e.name)))).flat();
}
async function check(raw, source) {
  const url = new URL(raw, new URL(relative(root, source), origin + '/'));
  if (!['https:', 'http:'].includes(url.protocol)) return;
  if (url.origin !== origin) { external.add(url.href); return; }
  const path = resolve(root, '.' + decodeURIComponent(url.pathname));
  assert(path === root || path.startsWith(root + sep), `Path outside site: ${raw}`);
  const file = (await stat(path)).isDirectory() ? resolve(path, 'index.html') : path;
  await stat(file);
  if (url.hash) {
    const { document } = parseHTML(await readFile(file, 'utf8'));
    assert(document.getElementById(decodeURIComponent(url.hash.slice(1))), `Broken fragment ${raw} in ${source}`);
  }
}
const all = await files(root);
for (const file of all) {
  const source = await readFile(file, 'utf8');
  if (file.endsWith('.html')) {
    const { document } = parseHTML(source);
    for (const node of document.querySelectorAll('[href], [src], meta[property="og:image"], meta[name="twitter:image"]')) {
      await check(node.getAttribute('href') ?? node.getAttribute('src') ?? node.getAttribute('content'), file);
    }
    if (!file.endsWith('_template.html')) {
      for (const node of document.querySelectorAll('a[href]')) assert(!node.getAttribute('href').includes('/modules/'), 'Draft template must stay unlinked');
    }
  } else if (file.endsWith('.css')) {
    for (const [, url] of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) await check(url, file);
  }
}
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.deepEqual(locations, [origin + '/']);
for (const url of external) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert(response.ok, `External link returned ${response.status}: ${url}`);
  await response.body?.cancel();
  console.log(`External link OK: ${url}`);
}
console.log('HTML, CSS, image/font links and fragments resolve; sitemap contains home only; template stays unlinked.');
