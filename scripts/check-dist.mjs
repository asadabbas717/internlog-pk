import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const publicFiles = new Set([
  'index.html',
  'sw.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'THIRD_PARTY_NOTICES.txt',
]);
async function files(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        if (entry.isSymbolicLink())
          throw new Error('Distribution must not contain links.');
        return entry.isDirectory()
          ? files(`${directory}/${entry.name}`, `${prefix}${entry.name}/`)
          : [`${prefix}${entry.name}`];
      }),
    )
  ).flat();
}
let allGzip = 0;
let jsGzip = 0;
for (const file of await files('dist')) {
  if (!publicFiles.has(file) && !/^assets\/[^/]+\.(js|css)$/.test(file))
    throw new Error(
      'Unexpected distribution asset. Review public files before publication.',
    );
  const content = await readFile(`dist/${file}`);
  const bytes = gzipSync(content).byteLength;
  allGzip += bytes;
  if (file.endsWith('.js') && file !== 'sw.js') {
    jsGzip += bytes;
    if (content.includes('storageHarness'))
      throw new Error('Development fixture must not ship.');
  }
}
const html = await readFile('dist/index.html', 'utf8');
if (
  !html.includes("connect-src 'self';") ||
  html.includes('ws://') ||
  !html.includes('src="./assets/')
)
  throw new Error(
    'Production policy or relative asset paths failed verification.',
  );
if (jsGzip > 100 * 1024 || allGzip > 160 * 1024)
  throw new Error(
    'Distribution exceeds the documented gzip budget. Review before changing it.',
  );
console.log(
  `Distribution: JS ${jsGzip} gzip bytes; all static assets ${allGzip} gzip bytes. Budgets passed.`,
);
