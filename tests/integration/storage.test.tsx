import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IDBFactory,
  IDBObjectStore,
  IDBVersionChangeEvent,
} from 'fake-indexeddb';
import {
  DATABASE_VERSION,
  openLogDatabase,
  StorageError,
} from '../../src/infrastructure/storage/database';
import type { LogDatabase } from '../../src/infrastructure/storage/database';
import { encodeData } from '../../src/infrastructure/storage/codec';
import { makeData, makeEntry, makeProfile } from '../fixtures/data';

let factory: IDBFactory;
const handles: LogDatabase[] = [];
const rawConnections: IDBDatabase[] = [];
beforeEach(() => {
  factory = new IDBFactory();
});
afterEach(() => {
  handles.splice(0).forEach((handle) => {
    handle.close();
  });
  rawConnections.splice(0).forEach((db) => {
    db.close();
  });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function open() {
  const handle = await openLogDatabase({ factory });
  handles.push(handle);
  return handle;
}

function rawOpen(
  version: number,
  initialize?: (db: IDBDatabase) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open('internlog-pk', version);
    request.onupgradeneeded = () => {
      initialize?.(request.result);
    };
    request.onerror = () => {
      reject(new Error('Raw database open failed'));
    };
    request.onsuccess = () => {
      rawConnections.push(request.result);
      resolve(request.result);
    };
  });
}

async function writeRaw(value: unknown, remove = false) {
  const db = await rawOpen(DATABASE_VERSION);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite');
    if (remove) tx.objectStore('state').delete('current');
    else tx.objectStore('state').put(value, 'current');
    tx.oncomplete = () => {
      resolve();
    };
    tx.onabort = () => {
      reject(new Error('Raw transaction aborted'));
    };
  });
  db.close();
}

describe('versioned native IndexedDB adapter', () => {
  it('initializes version 1 through upgrade 0→1 and persists across connection reload', async () => {
    const db = await open();
    expect(await db.load()).toEqual({
      revision: 0,
      data: { profile: null, entries: [] },
    });
    const saved = await db.save(makeData(), 0);
    expect(saved).toEqual({ revision: 1, data: makeData() });
    db.close();
    const reopened = await open();
    expect(await reopened.load()).toEqual(saved);
    expect((await rawOpen(1)).version).toBe(1);
  });
  it('persists edits and deletions as one revision-checked dataset', async () => {
    const db = await open();
    await db.save(makeData(), 0);
    const edited = makeData([makeEntry(1, { durationMinutes: 61 })]);
    expect(await db.save(edited, 1)).toEqual({ revision: 2, data: edited });
    const emptyEntries = { profile: makeProfile(), entries: [] };
    expect(await db.save(emptyEntries, 2)).toEqual({
      revision: 3,
      data: emptyEntries,
    });
    expect(await db.load()).toEqual({ revision: 3, data: emptyEntries });
  });
  it('rejects invalid updates and revisions before modifying existing records', async () => {
    const db = await open();
    const saved = await db.save(makeData(), 0);
    await expect(
      db.save(makeData([makeEntry(1, { durationMinutes: -1 })]), 1),
    ).rejects.toMatchObject({ name: 'ValidationError' });
    await expect(db.save(makeData(), -1)).rejects.toMatchObject({
      name: 'ValidationError',
    });
    await expect(
      db.save(
        { ...makeData(), profile: makeProfile({ startDate: '2026-10-20' }) },
        1,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError' });
    expect(await db.load()).toEqual(saved);
  });
  it('prevents stale writes from another tab', async () => {
    const a = await open();
    const b = await open();
    const old = await b.load();
    const saved = await a.save(makeData(), 0);
    await expect(
      b.save({ profile: makeProfile(), entries: [] }, old.revision),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(await b.load()).toEqual(saved);
  });
  it('serializes simultaneous competing writers, accepting exactly one', async () => {
    const a = await open();
    const b = await open();
    const results = await Promise.allSettled([
      a.save(makeData(), 0),
      b.save(makeData([makeEntry(2)]), 0),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const failed = results.find((result) => result.status === 'rejected');
    expect(
      failed?.status === 'rejected' &&
        failed.reason instanceof StorageError &&
        failed.reason.code,
    ).toBe('conflict');
    expect((await a.load()).revision).toBe(1);
    expect(await a.load()).toEqual(await b.load());
  });
  it.each([
    null,
    {},
    { revision: -1, payload: encodeData(makeData()) },
    { revision: 1, payload: 7 },
    { revision: 1, payload: '{bad' },
    {
      revision: 1,
      payload: '{"format":"internlog-pk-data","version":99,"data":{}}',
    },
    {
      revision: 1,
      payload: JSON.stringify({
        format: 'internlog-pk-data',
        version: 1,
        data: { profile: null, entries: [makeEntry()] },
      }),
    },
  ])('does not reset or overwrite a corrupt stored record', async (value) => {
    const db = await open();
    await writeRaw(value);
    await expect(db.load()).rejects.toMatchObject({ code: 'corrupt' });
    await expect(db.save(makeData(), 0)).rejects.toMatchObject({
      code: 'corrupt',
    });
    const raw = await rawOpen(1);
    const actual = await new Promise<unknown>((resolve) => {
      const request = raw
        .transaction('state')
        .objectStore('state')
        .get('current');
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
    expect(actual).toEqual(value);
  });
  it('does not silently recreate a missing record', async () => {
    const db = await open();
    await writeRaw(null, true);
    await expect(db.load()).rejects.toMatchObject({ code: 'corrupt' });
    await expect(db.save(makeData(), 0)).rejects.toMatchObject({
      code: 'corrupt',
    });
  });
  it('rolls back a queued write if its transaction aborts before commit', async () => {
    const db = await open();
    const original = await db.save(makeData(), 0);
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put');
    spy.mockImplementationOnce(function (
      this: IDBObjectStore,
      value: unknown,
      key?: IDBValidKey,
    ) {
      spy.mockRestore();
      const request = this.put(value, key);
      this.transaction.abort();
      return request;
    });
    await expect(db.save(makeData([makeEntry(2)]), 1)).rejects.toMatchObject({
      code: 'transaction',
    });
    spy.mockRestore();
    expect(await db.load()).toEqual(original);
  });
  it('reports quota failure and preserves the last successful save', async () => {
    const db = await open();
    const original = await db.save(makeData(), 0);
    const spy = vi
      .spyOn(IDBObjectStore.prototype, 'put')
      .mockImplementation(() => {
        throw new DOMException('No space', 'QuotaExceededError');
      });
    await expect(db.save(makeData(), 1)).rejects.toMatchObject({
      code: 'quota',
    });
    spy.mockRestore();
    expect(await db.load()).toEqual(original);
  });
  it('reports closed handles and closes on a future version upgrade', async () => {
    const db = await open();
    await db.save(makeData(), 0);
    const upgraded = await rawOpen(2, (raw) => {
      raw.createObjectStore('future');
    });
    await expect(db.load()).rejects.toMatchObject({ code: 'closed' });
    upgraded.close();
    await expect(open()).rejects.toMatchObject({ code: 'incompatible' });
    const raw = await rawOpen(2);
    const record = await new Promise<unknown>((resolve) => {
      const request = raw
        .transaction('state')
        .objectStore('state')
        .get('current');
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
    expect(record).toEqual({ revision: 1, payload: encodeData(makeData()) });
  });
  it.each(['missing-store', 'wrong-key', 'auto-increment', 'extra-store'])(
    'refuses incompatible schema %s without rebuilding it',
    async (variant) => {
      const raw = await rawOpen(1, (db) => {
        if (variant === 'missing-store') db.createObjectStore('wrong');
        else if (variant === 'wrong-key')
          db.createObjectStore('state', { keyPath: 'id' });
        else if (variant === 'auto-increment')
          db.createObjectStore('state', { autoIncrement: true });
        else {
          db.createObjectStore('state');
          db.createObjectStore('extra');
        }
      });
      raw.close();
      await expect(open()).rejects.toMatchObject({ code: 'incompatible' });
      expect((await rawOpen(1)).objectStoreNames.length).toBe(
        variant === 'extra-store' ? 2 : 1,
      );
    },
  );
  it('reports unavailable browsers and denied storage without leaking error text', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(openLogDatabase()).rejects.toMatchObject({
      code: 'unavailable',
    });
    const spy = vi.spyOn(factory, 'open').mockImplementation(() => {
      throw new DOMException('Sensitive platform details', 'SecurityError');
    });
    await expect(open()).rejects.toMatchObject({ code: 'unavailable' });
    await expect(open()).rejects.not.toThrow('Sensitive platform details');
    spy.mockRestore();
  });
  it('reports initialization failures instead of returning an empty success', async () => {
    vi.spyOn(factory, 'open').mockImplementation(() => {
      throw new Error('Failed');
    });
    await expect(open()).rejects.toMatchObject({ code: 'transaction' });
  });
  it('reports a blocked open and aborts any late initial upgrade', async () => {
    const originalOpen = factory.open.bind(factory);
    const spy = vi
      .spyOn(factory, 'open')
      .mockImplementation((name, version) => {
        const request = originalOpen(name, version);
        // Version 1 has no prior schema to upgrade. Exercise the browser event
        // guard explicitly so future migrations retain a tested blocked path.
        queueMicrotask(() => {
          request.onblocked?.call(
            request,
            new IDBVersionChangeEvent('blocked'),
          );
        });
        return request;
      });
    await expect(open()).rejects.toMatchObject({ code: 'blocked' });
    spy.mockRestore();
    expect(await (await open()).load()).toEqual({
      revision: 0,
      data: { profile: null, entries: [] },
    });
  });
  it('aborts initialization atomically when the initial record cannot be created', async () => {
    const spy = vi
      .spyOn(IDBObjectStore.prototype, 'add')
      .mockImplementation(() => {
        throw new DOMException('No space', 'QuotaExceededError');
      });
    await expect(open()).rejects.toMatchObject({ code: 'quota' });
    spy.mockRestore();
    // The failed versionchange transaction did not leave a half-created schema.
    const db = await open();
    expect(await db.load()).toEqual({
      revision: 0,
      data: { profile: null, entries: [] },
    });
  });
  it('preserves asynchronous initialization request errors and rolls back', async () => {
    const spy = vi.spyOn(IDBObjectStore.prototype, 'add');
    spy.mockImplementationOnce(function (
      this: IDBObjectStore,
      value: unknown,
      key?: IDBValidKey,
    ) {
      spy.mockRestore();
      const request = this.add(value, key);
      const tx = this.transaction;
      // Inject the asynchronous request-level quota path, not a synchronous throw.
      queueMicrotask(() => {
        Object.defineProperty(request, 'error', {
          value: new DOMException('No space', 'QuotaExceededError'),
          writable: true,
          configurable: true,
        });
        request.onerror?.call(request, new Event('error'));
        tx.abort();
      });
      return request;
    });
    await expect(open()).rejects.toMatchObject({ code: 'quota' });
    expect(await (await open()).load()).toEqual({
      revision: 0,
      data: { profile: null, entries: [] },
    });
  });
  it('reports blocked initialization and cancels the late schema upgrade', async () => {
    const raw = await rawOpen(1, (db) => {
      db.createObjectStore('legacy');
    });
    // A deleting connection blocks our queued open; keep the old connection open.
    const deletion = factory.deleteDatabase('internlog-pk');
    await new Promise<void>((resolve) => {
      deletion.onblocked = () => {
        resolve();
      };
    });
    const pending = openLogDatabase({ factory, timeoutMs: 10 });
    await expect(pending).rejects.toMatchObject({ code: 'timeout' });
    raw.close();
    await new Promise<void>((resolve, reject) => {
      deletion.onsuccess = () => {
        resolve();
      };
      deletion.onerror = () => {
        reject(new Error('Raw deletion failed'));
      };
    });
    // Drain the queued, timed-out open before retrying initialization.
    const db = await open();
    expect(await db.load()).toEqual({
      revision: 0,
      data: { profile: null, entries: [] },
    });
  });
});
