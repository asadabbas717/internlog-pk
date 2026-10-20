import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { InternshipData } from '../../src/domain/model';
import { encodeBackup } from '../../src/infrastructure/export/backup';

export async function restoreSynthetic(page: Page, data: InternshipData) {
  await page.getByLabel('Choose JSON backup to inspect').setInputFiles({
    name: 'synthetic.json',
    mimeType: 'application/json',
    buffer: Buffer.from(encodeBackup(data)),
  });
  await page
    .getByRole('button', { name: 'Continue to replacement confirmation' })
    .click();
  await page.getByRole('checkbox', { name: /I understand/ }).check();
  await page.getByRole('button', { name: 'Replace all records' }).click();
  await expect(
    page.getByText(/Replacement committed successfully/),
  ).toBeVisible();
}
