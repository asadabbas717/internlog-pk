import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { makeData, makeEntry, makeProfile } from '../fixtures/data';
import { encodeBackup } from '../../src/infrastructure/export/backup';

const data = makeData([
  makeEntry(1, {
    durationMinutes: 61,
    description: '<script>not executable</script> پاکستانی sample work',
    referenceUrl: 'https://example.org/evidence',
  }),
  makeEntry(2, { durationMinutes: 59, date: '2026-10-25' }),
  makeEntry(3, { durationMinutes: 1, date: '2026-10-26' }),
]);
async function inspect(page: Page, json = encodeBackup(data)) {
  await page.getByLabel('Choose JSON backup to inspect').setInputFiles({
    name: 'synthetic.json',
    mimeType: 'application/json',
    buffer: Buffer.from(json),
  });
}
async function restore(page: Page) {
  await page
    .getByRole('button', { name: 'Continue to replacement confirmation' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Keep current records' }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Replace all records' }),
  ).toBeDisabled();
  await page.getByRole('checkbox', { name: /I understand/ }).check();
  await page.getByRole('button', { name: 'Replace all records' }).click();
  await expect(
    page.getByText(/Replacement committed successfully/),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Backups and recovery' }),
  ).toBeFocused();
}

test('portable backup round-trip works offline and never caches private exports', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await inspect(page);
  await restore(page);
  await expect(
    page.getByRole('article', { name: 'Work entry on 2026-10-19' }),
  ).toContainText('<script>not executable</script>');
  await expect(
    page.getByRole('status', { name: 'Offline availability' }),
  ).toHaveText(/ready for offline use/, { timeout: 20000 });
  await context.setOffline(true);
  await page.reload();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export current backup' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('internlog-pk-backup.json');
  const path = await download.path();
  if (!path) throw new Error('Missing backup download');
  expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
    format: 'internlog-pk',
    version: 1,
    ...data,
  });
  await inspect(page, encodeBackup({ profile: null, entries: [] }));
  await restore(page);
  await expect(
    page.getByRole('heading', { name: 'Set up your internship' }),
  ).toBeVisible();
  await inspect(page, await readFile(path, 'utf8'));
  await restore(page);
  await page.reload();
  await expect(
    page.getByRole('article', { name: 'Work entry on 2026-10-19' }),
  ).toBeVisible();
  const cached = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (key) =>
          (await (await caches.open(key)).keys()).map((r) => r.url),
        ),
      )
    ).flat(),
  );
  expect(
    cached.every((url) => !url.includes('backup') && !url.startsWith('blob:')),
  ).toBe(true);
});

test('malformed and oversized imports preserve data and cancelled confirmation preserves drafts', async ({
  page,
}) => {
  await page.goto('./');
  await inspect(page);
  await restore(page);
  await page.getByRole('button', { name: /Add entry/ }).click();
  await page
    .getByLabel('Work performed', { exact: true })
    .fill('Unsaved synthetic draft');
  await inspect(
    page,
    '{"format":"internlog-pk","version":7,"profile":null,"entries":[]}',
  );
  await expect(page.getByRole('alert')).toHaveText(/Unsupported backup/);
  await inspect(page, 'x'.repeat(5 * 1024 * 1024 + 1));
  await expect(page.getByRole('alert')).toHaveText(/5 MiB/);
  await inspect(page);
  await page
    .getByRole('button', { name: 'Continue to replacement confirmation' })
    .click();
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Work performed', { exact: true })).toHaveValue(
    'Unsaved synthetic draft',
  );
  await expect(
    page.getByRole('article', { name: 'Work entry on 2026-10-19' }),
  ).toBeVisible();
});

test('concurrent edits require refresh and new replacement review', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await inspect(page);
  await restore(page);
  const other = await context.newPage();
  await other.goto('./');
  await inspect(other);
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page
    .getByLabel('Host organization', { exact: true })
    .fill('New synthetic host');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByText('Profile saved on this browser.')).toBeVisible();
  await other
    .getByRole('button', { name: 'Continue to replacement confirmation' })
    .click();
  await other.getByRole('checkbox', { name: /I understand/ }).check();
  await other.getByRole('button', { name: 'Replace all records' }).click();
  await expect(
    other.getByText(/Records changed in another tab/).first(),
  ).toBeVisible();
  await other
    .getByRole('button', { name: 'Load latest records (keep draft)' })
    .click();
  await expect(
    other.getByText(/Saved records changed after inspection/),
  ).toBeVisible();
  await expect(
    other
      .getByRole('region', { name: 'Internship profile' })
      .getByText('New synthetic host', { exact: true }),
  ).toBeVisible();
  await expect(
    other.getByRole('button', { name: 'Continue to replacement confirmation' }),
  ).not.toBeVisible();
  await other
    .getByRole('button', { name: 'Review replacement against latest records' })
    .click();
  await restore(other);
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Internship profile' })
      .getByText('Example Software', { exact: true }),
  ).toBeVisible();
});

test('saved logbook has accurate print totals, safe wrapping and excludes unsaved drafts', async ({
  page,
}, testInfo) => {
  await page.goto('./');
  const longData = {
    profile: makeProfile(),
    entries: [
      ...data.entries,
      makeEntry(4, {
        date: '2026-10-27',
        durationMinutes: 60,
        description: 'LongSyntheticWord'.repeat(200),
        learningOutcomes: 'Reviewed long multilingual content پاکستانی '
          .repeat(20)
          .trim(),
      }),
    ],
  };
  await inspect(page, encodeBackup(longData));
  await restore(page);
  await page.getByRole('button', { name: /Add entry/ }).click();
  await page
    .getByLabel('Work performed', { exact: true })
    .fill('UNSAVED_DRAFT_EXCLUDED');
  await page.getByRole('button', { name: 'Preview saved logbook' }).click();
  const report = page.getByRole('region', { name: 'Internship logbook' });
  await expect(report).toContainText('3h 1m');
  await expect(
    report.getByRole('region', { name: 'Report week beginning 2026-10-19' }),
  ).toContainText('Weekly total: 2h 0m');
  await expect(report).not.toContainText('UNSAVED_DRAFT_EXCLUDED');
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('navigation')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Export current backup' }),
  ).not.toBeVisible();
  await expect(report).toBeVisible();
  await page.pdf({
    path: testInfo.outputPath('logbook.pdf'),
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  await page.screenshot({
    path: testInfo.outputPath('print-layout.png'),
    fullPage: true,
  });
});
