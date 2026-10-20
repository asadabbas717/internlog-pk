import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { makeData, makeEntry } from '../fixtures/data';
import { restoreSynthetic } from './helpers';

test('saved workflows reflow at narrow widths, text zoom and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await restoreSynthetic(
    page,
    makeData([makeEntry(1, { description: 'LongSyntheticWord'.repeat(80) })]),
  );
  await page.getByRole('button', { name: 'Preview saved logbook' }).click();
  for (const size of [
    { width: 320, height: 640 },
    { width: 667, height: 375 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(size);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.setViewportSize({ width: 320, height: 640 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe('auto');
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
});

test('dialog keyboard focus remains contained and returns after cancellation', async ({
  page,
}) => {
  await page.goto('./');
  await restoreSynthetic(page, makeData());
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep entry' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Delete permanently' }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Keep entry' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Delete entry', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('article', { name: /Work entry on/ }),
  ).toHaveCount(1);
});

test('native print preparation includes all saved records without mounting reports during ordinary use', async ({
  page,
  browserName,
}, testInfo) => {
  await page.goto('./');
  await restoreSynthetic(page, makeData());
  await expect(page.locator('#report')).toHaveCount(0);
  await page.getByRole('button', { name: /Add entry/ }).click();
  await page
    .getByLabel('Work performed', { exact: true })
    .fill('UNSAVED_PRINT_DRAFT');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeprint'));
  });
  await expect(page.locator('#report')).toContainText(
    'Implemented and tested a sample form.',
  );
  await expect(page.locator('#report')).not.toContainText(
    'UNSAVED_PRINT_DRAFT',
  );
  await page.evaluate(() => {
    window.dispatchEvent(new Event('afterprint'));
  });
  await expect(page.locator('#report')).toHaveCount(0);
  if (browserName === 'chromium') {
    // The native PDF call itself fires beforeprint; no preview/event injection precedes it.
    await page.pdf({
      path: testInfo.outputPath('native-no-preview.pdf'),
      preferCSSPageSize: true,
    });
  }
  await expect(page.getByLabel('Work performed', { exact: true })).toHaveValue(
    'UNSAVED_PRINT_DRAFT',
  );
});

test('install assets and restrictive production policy remain local and safely render hostile text', async ({
  page,
  request,
}) => {
  const external: string[] = [];
  const origin = 'http://127.0.0.1:4173';
  page.on('request', (req) => {
    if (req.url().startsWith('http') && new URL(req.url()).origin !== origin)
      external.push(req.url());
  });
  await page.goto('./');
  const policy = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(policy).toContain("connect-src 'self';");
  expect(policy).not.toContain('ws:');
  expect(policy).not.toContain('unsafe-inline');
  await restoreSynthetic(
    page,
    makeData([
      makeEntry(1, {
        description:
          '<img src="https://example.org/private" onerror="alert(1)">',
      }),
    ]),
  );
  expect(await page.locator('.entry-card img').count()).toBe(0);
  const manifestResponse = await request.get('./manifest.webmanifest');
  const manifest: unknown = await manifestResponse.json();
  expect(manifest).toMatchObject({
    start_url: './',
    scope: './',
    display: 'standalone',
  });
  for (const [name, size] of [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['icon-maskable-512.png', 512],
    ['apple-touch-icon.png', 180],
  ] as const) {
    const response = await request.get(`./${name}`);
    expect(response.ok()).toBe(true);
    const png = await response.body();
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
  expect(external).toEqual([]);
});
