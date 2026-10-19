// Development-server fixture only. Never imported by the production app.
import { openLogDatabase } from '../../src/infrastructure/storage/database';
import type { LogDatabase } from '../../src/infrastructure/storage/database';
import { makeData } from './data';

let db: LogDatabase | undefined;
function current(): LogDatabase {
  if (!db) throw new Error('Initialize the synthetic storage fixture first.');
  return db;
}
const harness = {
  async open() {
    db?.close();
    db = await openLogDatabase({ name: 'internlog-pk-browser-test' });
  },
  load: () => current().load(),
  save: (data: unknown, revision: number) => current().save(data, revision),
  close: () => db?.close(),
  sample: makeData,
};

declare global {
  interface Window {
    storageHarness?: typeof harness;
  }
}

window.storageHarness = harness;
