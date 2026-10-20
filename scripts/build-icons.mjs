import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Rasterize the existing code-native mark; no fonts or external image service.
const svg = await readFile('public/icon.svg', 'utf8');
const browser = await chromium.launch();
try {
  for (const { size, file, square } of [
    { size: 192, file: 'icon-192.png', square: false },
    { size: 512, file: 'icon-512.png', square: false },
    { size: 512, file: 'icon-maskable-512.png', square: true },
    { size: 180, file: 'apple-touch-icon.png', square: true },
  ]) {
    const source = square ? svg.replace('rx="100"', '') : svg;
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.goto(
      `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`,
    );
    await page.screenshot({ path: `public/${file}`, omitBackground: true });
    await page.close();
  }
} finally {
  await browser.close();
}
