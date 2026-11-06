import { test, expect } from '@playwright/test';

test('installs a complete offline precache and calculates without a network', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Redo');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error('Service worker is not active');
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = (await Promise.all(names.map(async name => {
      const cache = await caches.open(name);
      return (await cache.keys()).map(request => new URL(request.url).pathname);
    }))).flat();
    return { names, urls };
  });
  expect(cached.names.length).toBeGreaterThan(0);
  expect(cached.urls.some(url => url.endsWith('.wasm'))).toBe(true);
  expect(cached.urls.some(url => url.endsWith('.html') || url.endsWith('/'))).toBe(true);

  await page.locator('#expression').fill('2+3*4');
  await page.getByRole('button', { name: 'Beräkna' }).click();
  await expect(page.locator('output')).toHaveText('14');
  await page.getByRole('button', { name: 'Vetenskaplig' }).click();
  await page.getByRole('button', { name: 'RAD', exact: true }).click();
  await page.locator('#expression').fill('sin(pi/2)');
  await page.getByRole('button', { name: 'Beräkna' }).click();
  await expect(page.locator('output')).toHaveText('1');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Redo');
  await expect(page.getByRole('button', { name: 'Vetenskaplig' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'RAD', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.history-entry')).toHaveCount(2);
  await page.locator('#expression').fill('sqrt(81)');
  await page.getByRole('button', { name: 'Beräkna' }).click();
  await expect(page.locator('output')).toHaveText('9');
});

test('can clear private calculator data without clearing unrelated origin keys', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Redo');
  await page.evaluate(() => localStorage.setItem('unrelated-key', 'preserve'));
  await page.locator('#expression').fill('1+1');
  await page.getByRole('button', { name: 'Beräkna' }).click();
  await expect(page.locator('.history-entry')).toHaveCount(1);
  await page.getByRole('button', { name: 'Rensa alla lokala kalkylatordata' }).click();
  await expect(page.locator('.history-entry')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe('preserve');
  await page.reload();
  await expect(page.locator('.history-entry')).toHaveCount(0);
});
