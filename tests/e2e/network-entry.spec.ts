import { expect, test } from '@playwright/test';
import { makeData } from '../fixtures/data';
import { restoreSynthetic } from './helpers';

test('new entries persist on HTTP without secure-context randomUUID', async ({
  page,
}) => {
  // Serve the real production files under an untrusted HTTP test origin.
  // Routing avoids exposing a server to the LAN or depending on DNS.
  await page.route('http://internlog-lan.test/**', async (route) => {
    const url = new URL(route.request().url());
    url.host = '127.0.0.1:4173';
    await route.fulfill({
      response: await route.fetch({
        url: url.href,
        headers: { ...route.request().headers(), host: url.host },
      }),
    });
  });
  await page.goto('http://internlog-lan.test/internlog-pk/');
  expect(await page.evaluate(() => window.isSecureContext)).toBe(false);
  await restoreSynthetic(page, makeData([]));
  expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined');
  await page.getByRole('button', { name: /Add entry/ }).click();
  await page.getByLabel('Work date', { exact: true }).fill('2026-10-21');
  await page
    .getByLabel('Work performed', { exact: true })
    .fill('Synthetic LAN test');
  await page.getByLabel('Hours worked', { exact: true }).fill('10');
  await page.getByLabel('Minutes worked', { exact: true }).fill('0');
  await page
    .getByLabel('Skills or learning outcomes', { exact: true })
    .fill('Reviewed browser API availability');
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page.getByText('Entry saved on this browser.')).toBeVisible();
  await page.reload();
  const entry = page.getByRole('article', { name: 'Work entry on 2026-10-21' });
  await expect(entry).toContainText('Synthetic LAN test');
  await expect(entry).toContainText('10h 0m');
  await entry.getByRole('button', { name: 'Edit entry', exact: true }).click();
  await page.getByLabel('Hours worked', { exact: true }).fill('9');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(entry).toContainText('9h 0m');
  await expect(
    page.getByRole('article', { name: /Work entry on/ }),
  ).toHaveCount(1);
});
