import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { makeData } from '../fixtures/data';

async function initialize(page: Page) {
  await page.goto('http://127.0.0.1:4174/');
  await page.addScriptTag({
    type: 'module',
    url: 'http://127.0.0.1:4174/tests/fixtures/storage-harness.ts',
  });
  await page.waitForFunction(() => Boolean(window.storageHarness));
  await page.evaluate(async () => {
    if (!window.storageHarness) throw new Error('Fixture missing');
    await window.storageHarness.open();
  });
}

test('actual storage adapter persists across reload and works offline', async ({
  page,
  context,
}) => {
  await initialize(page);
  const saved = await page.evaluate(async () => {
    const harness = window.storageHarness;
    if (!harness) throw new Error('Fixture missing');
    const empty = await harness.load();
    if (
      empty.revision !== 0 ||
      empty.data.profile !== null ||
      empty.data.entries.length !== 0
    )
      throw new Error('Expected a fresh database');
    return harness.save(harness.sample(), empty.revision);
  });
  expect(saved).toEqual({ revision: 1, data: makeData() });
  await page.reload();
  await initialize(page);
  const loaded = await page.evaluate(async () => {
    if (!window.storageHarness) throw new Error('Fixture missing');
    return window.storageHarness.load();
  });
  expect(loaded).toEqual(saved);
  await context.setOffline(true);
  const offline = await page.evaluate(async () => {
    const harness = window.storageHarness;
    if (!harness) throw new Error('Fixture missing');
    const current = await harness.load();
    const saved = await harness.save(
      { ...current.data, entries: [] },
      current.revision,
    );
    harness.close();
    await harness.open();
    return { saved, reopened: await harness.load() };
  });
  expect(offline.saved).toEqual({
    revision: 2,
    data: { ...makeData(), entries: [] },
  });
  expect(offline.reopened).toEqual(offline.saved);
});

test('native transactions prevent concurrent tabs from overwriting each other', async ({
  page,
  context,
}) => {
  await initialize(page);
  const other = await context.newPage();
  await initialize(other);
  const first = await page.evaluate(async () => {
    if (!window.storageHarness) throw new Error('Fixture missing');
    return window.storageHarness.save(window.storageHarness.sample(), 0);
  });
  const conflict = await other.evaluate(async () => {
    const harness = window.storageHarness;
    if (!harness) throw new Error('Fixture missing');
    try {
      await harness.save({ profile: null, entries: [] }, 0);
      return 'incorrect success';
    } catch (error) {
      return error instanceof Error && 'code' in error
        ? error.code
        : 'unexpected error';
    }
  });
  expect(conflict).toBe('conflict');
  expect(
    await other.evaluate(async () => {
      if (!window.storageHarness) throw new Error('Fixture missing');
      return window.storageHarness.load();
    }),
  ).toEqual(first);
});
