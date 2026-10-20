import { expect, test } from '@playwright/test';

test('development server applies application styles without CSP violations', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', () => {
      document.documentElement.setAttribute('data-policy-violation', 'true');
    });
  });
  await page.goto('http://127.0.0.1:4174/');
  await expect(
    page.getByRole('heading', { name: 'Your internship, clearly recorded.' }),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('margin', '0px');
  await expect(page.locator('style[data-vite-dev-id]')).not.toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-policy-violation',
    'true',
  );
});
