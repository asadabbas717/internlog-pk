import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { makeData } from '../fixtures/data';
import { restoreSynthetic } from './helpers';

async function files(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) =>
        entry.isDirectory()
          ? files(`${directory}/${entry.name}`, `${prefix}${entry.name}/`)
          : [`${prefix}${entry.name}`],
      ),
    )
  ).flat();
}

async function fixture(failInstall = false) {
  const assets = (await files('dist')).filter((path) => path !== 'sw.js');
  const template = await readFile('scripts/sw-template.js', 'utf8');
  const state = { revision: 'one', cssRequests: 0 };
  const server = createServer((req, res) => {
    void (async () => {
      const path = new URL(req.url ?? '/', 'http://localhost').pathname;
      res.setHeader('Cache-Control', 'no-store');
      if (path === '/outside.html') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<!doctype html><title>Outside worker scope</title>');
        return;
      }
      if (path === '/internlog-pk/sw.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(
          template
            .replace('__VERSION__', state.revision)
            .replace('__ASSETS__', JSON.stringify(assets)) +
            `\nself.addEventListener('message', event => { event.ports[0].postMessage(${JSON.stringify(state.revision)}); });`,
        );
        return;
      }
      const asset =
        path === '/internlog-pk/'
          ? 'index.html'
          : path.slice('/internlog-pk/'.length);
      if (!path.startsWith('/internlog-pk/') || !assets.includes(asset)) {
        res.writeHead(404).end();
        return;
      }
      if (asset.endsWith('.css') && ++state.cssRequests > 1 && failInstall) {
        res.writeHead(503).end('Synthetic precache failure');
        return;
      }
      const content = await readFile(`dist/${asset}`);
      const type = asset.endsWith('.js')
        ? 'application/javascript'
        : asset.endsWith('.css')
          ? 'text/css'
          : asset.endsWith('.html')
            ? 'text/html'
            : asset.endsWith('.svg')
              ? 'image/svg+xml'
              : asset.endsWith('.webmanifest')
                ? 'application/manifest+json'
                : asset.endsWith('.png')
                  ? 'image/png'
                  : 'text/plain';
      res.setHeader('Content-Type', type);
      res.end(
        asset === 'index.html'
          ? content
              .toString()
              .replace(
                '</head>',
                `<meta name="fixture-revision" content="${state.revision}"></head>`,
              )
          : content,
      );
    })().catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing fixture port');
  return {
    state,
    origin: `http://127.0.0.1:${String(address.port)}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
        server.closeAllConnections();
      }),
  };
}

test('worker update waits for old clients and preserves records and unrelated caches', async ({
  page,
  context,
}) => {
  const site = await fixture();
  try {
    await page.goto(`${site.origin}/internlog-pk/`);
    await restoreSynthetic(page, makeData());
    await expect(
      page.getByRole('status', { name: 'Offline availability' }),
    ).toHaveText(/ready for offline use/);
    await page.reload();
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return (
        registration?.active?.state === 'activated' &&
        Boolean(navigator.serviceWorker.controller)
      );
    });
    await page.evaluate(async () => {
      await caches.open('unrelated-cache');
      await caches.open(`internlog-shell:${location.origin}/other/:old`);
    });
    site.state.revision = 'two';
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });
    await page.waitForFunction(async () =>
      Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
    );
    await page.reload();
    await expect(page.locator('meta[name="fixture-revision"]')).toHaveAttribute(
      'content',
      'one',
    );
    const outside = await context.newPage();
    await outside.goto(`${site.origin}/outside.html`);
    await page.close();
    await expect
      .poll(() =>
        outside.evaluate(async () => {
          const registration =
            await navigator.serviceWorker.getRegistration('/internlog-pk/');
          return (
            registration?.active?.state === 'activated' &&
            !registration.waiting &&
            (await new Promise((resolve) => {
              const channel = new MessageChannel();
              channel.port1.onmessage = (event) => {
                resolve(event.data === 'two');
                channel.port1.close();
              };
              registration.active?.postMessage('fixture-revision', [
                channel.port2,
              ]);
            })) &&
            !(await caches.keys()).some(
              (key) =>
                key === `internlog-shell:${location.origin}/internlog-pk/:one`,
            )
          );
        }),
      )
      .toBe(true);
    const cached = await outside.evaluate(() => caches.keys());
    expect(cached).not.toContain(
      `internlog-shell:${site.origin}/internlog-pk/:one`,
    );
    expect(cached).toContain('unrelated-cache');
    expect(cached).toContain(`internlog-shell:${site.origin}/other/:old`);
    const cachedShell = await outside.evaluate(async () => {
      const cache = await caches.open(
        `internlog-shell:${location.origin}/internlog-pk/:two`,
      );
      return (
        await cache.match(`${location.origin}/internlog-pk/index.html`)
      )?.text();
    });
    expect(cachedShell).toContain('content="two"');
    await outside.goto(`${site.origin}/internlog-pk/`);
    await expect(
      outside.locator('meta[name="fixture-revision"]'),
    ).toHaveAttribute('content', 'two');
    await expect(
      outside.getByRole('article', { name: /Work entry on/ }),
    ).toContainText('Implemented and tested a sample form.');
    await context.setOffline(true);
    await outside.reload();
    await expect(
      outside.getByRole('article', { name: /Work entry on/ }),
    ).toContainText('Implemented and tested a sample form.');
  } finally {
    await site.close();
  }
});

test('actual failed precache reports unavailable without resetting local records', async ({
  page,
}) => {
  const site = await fixture(true);
  try {
    await page.goto(`${site.origin}/internlog-pk/`);
    await restoreSynthetic(page, makeData());
    await expect(
      page.getByRole('status', { name: 'Offline availability' }),
    ).toHaveText(/Offline setup unavailable/, { timeout: 20000 });
    await expect(
      page.getByRole('article', { name: /Work entry on/ }),
    ).toContainText('Implemented and tested a sample form.');
    expect(
      await page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.active),
      ),
    ).toBe(false);
  } finally {
    await site.close();
  }
});
