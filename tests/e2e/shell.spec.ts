import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('keyboard navigation and mobile layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test('precaches only application assets and reopens offline', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await expect(
    page.getByRole('status', { name: 'Offline availability' }),
  ).toHaveText(/ready for offline use/, {
    timeout: 20000,
  });
  await page.evaluate(async () => {
    await fetch('./unrelated.json').catch(() => undefined);
  });
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map((request) => request.url),
        ),
      )
    ).flat();
  });
  expect(cached.some((url) => url.endsWith('/index.html'))).toBe(true);
  expect(cached.some((url) => url.includes('unrelated.json'))).toBe(false);
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('./');
  await expect(reopened.getByRole('heading', { level: 1 })).toHaveText(
    'Your internship, clearly recorded.',
  );
  await expect(
    reopened.getByRole('status', { name: 'Offline availability' }),
  ).toHaveText(/ready for offline use/);
});
