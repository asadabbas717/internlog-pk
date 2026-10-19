import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function profile(page: Page) {
  await page.getByLabel('Student name', { exact: true }).fill('Sample Student');
  await page
    .getByLabel('University or institution', { exact: true })
    .fill('Example University');
  await page
    .getByLabel('Degree or program', { exact: true })
    .fill('BS Computer Science');
  await page
    .getByLabel('Host organization', { exact: true })
    .fill('Example Software');
  await page
    .getByLabel('Internship start date', { exact: true })
    .fill('2026-01-01');
  await page
    .getByLabel('Internship end date', { exact: true })
    .fill('2026-12-31');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByText('Profile saved on this browser.')).toBeVisible();
}
async function draft(
  page: Page,
  description = 'Built a sample accessible form',
  date = '2026-10-19',
) {
  await page.getByRole('button', { name: /Add entry/ }).click();
  await page.getByLabel('Work date', { exact: true }).fill(date);
  await page.getByLabel('Work performed', { exact: true }).fill(description);
  await page.getByLabel('Hours worked', { exact: true }).fill('1');
  await page.getByLabel('Minutes worked', { exact: true }).fill('30');
  await page
    .getByLabel('Skills or learning outcomes', { exact: true })
    .fill('Accessible form validation');
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page.getByText('Entry saved on this browser.')).toBeVisible();
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test('complete profile and entry CRUD workflow with validation, safe links and accurate totals', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(
    page.getByRole('heading', { name: 'Set up your internship' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(
    page.getByLabel('Internship start date', { exact: true }),
  ).toBeFocused();
  await profile(page);
  await draft(page);
  await page
    .getByLabel('Evidence link', { exact: false })
    .fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(
    page.getByLabel('Evidence link', { exact: false }),
  ).toBeFocused();
  await page
    .getByLabel('Evidence link', { exact: false })
    .fill('https://example.org/nonconfidential');
  await save(page);
  await expect(page.getByText('1% of your target recorded')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('1h 30m');
  await expect(
    page.getByRole('link', { name: /Open evidence/ }),
  ).toHaveAttribute('rel', 'noopener noreferrer');
  await accessible(page);
  await page.getByRole('button', { name: 'Edit entry', exact: true }).click();
  await page.getByLabel('Hours worked', { exact: true }).fill('2');
  await page.getByLabel('Minutes worked', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Work entry on 2026-10-19' }),
  ).toContainText('2h 1m');
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Delete this work entry?' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep entry' })).toBeFocused();
  await accessible(page);
  await page.getByRole('button', { name: 'Keep entry' }).click();
  await expect(
    page.getByRole('button', { name: 'Edit entry', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await page
    .getByRole('button', { name: 'Delete permanently', exact: true })
    .click();
  await expect(
    page.getByText('Entry deleted from this browser.'),
  ).toBeVisible();
  await expect(page.getByText('0% of your target recorded')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Sample Student', { exact: true })).toBeVisible();
  await expect(page.getByText('Your work belongs here.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('saved student workflow reopens and records more work offline', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await profile(page);
  await draft(page);
  await save(page);
  await expect(
    page.getByRole('status', { name: 'Offline availability' }),
  ).toHaveText(/ready for offline use/, { timeout: 20000 });
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('./');
  await expect(
    reopened.getByText('Sample Student', { exact: true }),
  ).toBeVisible();
  await expect(
    reopened.getByRole('article', { name: 'Work entry on 2026-10-19' }),
  ).toContainText('Built a sample accessible form');
  await draft(reopened, 'Reviewed a synthetic component offline', '2026-10-20');
  await save(reopened);
  await reopened.reload();
  await expect(reopened.getByText('2% of your target recorded')).toBeVisible();
  await expect(
    reopened.getByRole('article', { name: 'Work entry on 2026-10-20' }),
  ).toContainText('Reviewed a synthetic component offline');
});

test('stale-tab UI keeps its draft and requires explicit refresh before resubmission', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await profile(page);
  const other = await context.newPage();
  await other.goto('./');
  await draft(other, 'Draft from another tab', '2026-10-20');
  await draft(page, 'First tab saved task');
  await save(page);
  await other.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(other.getByText(/Records changed in another tab/)).toBeVisible();
  await expect(other.getByLabel('Work performed', { exact: true })).toHaveValue(
    'Draft from another tab',
  );
  await expect(
    other.getByRole('button', { name: 'Save entry', exact: true }),
  ).toBeDisabled();
  await other
    .getByRole('button', { name: 'Load latest records (keep draft)' })
    .click();
  await expect(other.getByText(/Latest records loaded/)).toBeVisible();
  await expect(
    other.getByText('First tab saved task', { exact: true }),
  ).toBeVisible();
  await expect(other.getByLabel('Work performed', { exact: true })).toHaveValue(
    'Draft from another tab',
  );
  await save(other);
  await page.reload();
  await expect(
    page.getByRole('article', { name: 'Work entry on 2026-10-20' }),
  ).toBeVisible();
  await expect(
    page.getByRole('article', { name: 'Work entry on 2026-10-19' }),
  ).toBeVisible();
});

test('denied local storage reports an error without presenting a false empty logbook', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
  });
  await page.goto('./');
  await expect(page.getByText(/Local storage is unavailable/)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Set up your internship' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Retry local storage' }),
  ).toBeEnabled();
});
