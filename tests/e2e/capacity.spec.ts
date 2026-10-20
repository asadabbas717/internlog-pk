import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { makeData, makeEntry } from '../fixtures/data';
import { restoreSynthetic } from './helpers';

for (const count of [1000, 10000])
  test(`synthetic capacity measurement preserves ${String(count)} records under CPU throttling`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(90000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto('./');
    const data = makeData(
      Array.from({ length: count }, (_, index) =>
        makeEntry(index + 1, {
          date: `2026-10-${String(19 + Math.floor(index / (count === 1000 ? 200 : 1000))).padStart(2, '0')}`,
          durationMinutes: 1,
        }),
      ),
    );
    const started = Date.now();
    await restoreSynthetic(page, data);
    const measurement = {
      records: count,
      cpuThrottle: 4,
      restoreToFeedbackMs: Date.now() - started,
      entryCards: await page.locator('.entry-card').count(),
      reportRowsBeforePreview: await page
        .locator('.print-report tbody tr')
        .count(),
      domElements: await page.locator('*').count(),
    };
    expect(measurement.entryCards).toBe(50);
    expect(measurement.reportRowsBeforePreview).toBe(0);
    expect(measurement.domElements).toBeLessThan(1500);
    await page.getByRole('button', { name: 'Next entries' }).click();
    await expect(
      page.getByText(`Entries 51–100 of ${String(count)}`, { exact: true }),
    ).toBeVisible();
    console.log(JSON.stringify({ capacityMeasurement: measurement }));
    await testInfo.attach('capacity-measurement', {
      body: JSON.stringify(measurement, null, 2),
      contentType: 'application/json',
    });
    const event = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export current backup' }).click();
    const path = await (await event).path();
    if (!path) throw new Error('Missing synthetic backup');
    const exported: unknown = JSON.parse(await readFile(path, 'utf8'));
    expect(exported).toEqual({ format: 'internlog-pk', version: 1, ...data });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  });
