import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-links.mjs', import.meta.url));

async function check(t, href, robots = 'noindex, nofollow') {
  const scratch = await mkdtemp(join(tmpdir(), 'eurorack-check-'));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const site = join(scratch, 'site');
  await mkdir(join(site, 'modules'), { recursive: true });
  await writeFile(join(site, 'index.html'), href ? '<a href="' + href + '">Module</a>' : '<h1>Home</h1>');
  await writeFile(join(site, 'modules/draft.html'),
    '<meta name="robots" content="' + robots + '"><a href="#main">Skip</a><main id="main">Draft</main>');
  await writeFile(join(site, 'sitemap.xml'), '<urlset><url><loc>https://eurorack.epsilonrecords.com/</loc></url></urlset>');
  return spawnSync(process.execPath, [checker], { cwd: scratch, encoding: 'utf8' });
}

test('blocks a relative link to a module draft', async (t) => {
  const result = await check(t, 'modules/draft.html');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Draft module must stay unlinked/);
});

test('requires noindex on draft pages even if they are unlinked', async (t) => {
  const result = await check(t, null, 'nofollow');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Draft module needs a noindex directive/);
});

test('permits an unlinked noindex draft and its own skip link', async (t) => {
  const result = await check(t, null);
  assert.equal(result.status, 0, result.stderr);
});
