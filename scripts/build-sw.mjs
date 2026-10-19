import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const relative = `${prefix}${entry.name}`;
      return entry.isDirectory()
        ? listFiles(`${directory}/${entry.name}`, `${relative}/`)
        : [relative];
    }),
  );
  return paths.flat().sort();
}

const files = (await listFiles('dist')).filter((path) => path !== 'sw.js');
const hash = createHash('sha256');
for (const file of files) {
  hash.update(file);
  hash.update(await readFile(`dist/${file}`));
}
const version = hash.digest('hex').slice(0, 16);
const template = await readFile('scripts/sw-template.js', 'utf8');
await writeFile(
  'dist/sw.js',
  template
    .replace('__VERSION__', version)
    .replace('__ASSETS__', JSON.stringify(files)),
);
console.log(
  `Service worker: ${files.length} build assets, revision ${version}`,
);
