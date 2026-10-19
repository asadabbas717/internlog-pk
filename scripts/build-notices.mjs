import { readFile, writeFile } from 'node:fs/promises';

// Keep full runtime dependency notices in the distributed build even when
// minification removes source comments. Review this list with runtime changes.
const sections = await Promise.all(
  ['react', 'react-dom', 'scheduler'].map(async (name) => {
    const metadata = JSON.parse(
      await readFile(`node_modules/${name}/package.json`, 'utf8'),
    );
    const license = await readFile(`node_modules/${name}/LICENSE`, 'utf8');
    return `${name} ${metadata.version}\n${license}`;
  }),
);
await writeFile('dist/THIRD_PARTY_NOTICES.txt', sections.join('\n---\n\n'));
