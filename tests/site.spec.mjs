import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
async function htmlPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? htmlPages(resolve(dir, e.name)) : e.name.endsWith('.html') ? [relative(resolve('site'), resolve(dir, e.name))] : []))).flat();
}
for (const path of await htmlPages(resolve('site'))) {
  for (const width of [375, 1440]) {
    test(`${path}: axe, keyboard and layout at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto('/' + path);
      expect(response.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // The product remains dark even with a light OS preference, without script.
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 15, 17)');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeInViewport();
      const heading = await page.locator('h1').boundingBox();
      const header = await page.locator('header').boundingBox();
      expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height);
      for (const link of await page.locator('header nav a').all()) await expect(link).toBeVisible();
      if (path !== 'modules/_template.html') {
        await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur(); });
        const shot = testInfo.outputPath(`${path.replace('.html', '')}-${width}.png`);
        await page.screenshot({ path: shot, fullPage: true });
        await testInfo.attach('page screenshot', { path: shot, contentType: 'image/png' });
      } else await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    });
  }
}
test('missing URLs return a usable 404 and the return link works', async ({ page }) => {
  const response = await page.goto('/missing-page');
  expect(response.status()).toBe(404);
  await page.getByRole('link', { name: 'Return home' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Open designs.');
});
