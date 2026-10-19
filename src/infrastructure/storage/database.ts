import type { InternshipData } from '../../domain/model';
import { ValidationError } from '../../domain/model';
import { integer, readObject } from '../../domain/validation';
import { decodeData, encodeData } from './codec';

export const DATABASE_NAME = 'internlog-pk';
export const DATABASE_VERSION = 1;
const STORE = 'state';
const KEY = 'current';

type StorageErrorCode =
  | 'unavailable'
  | 'blocked'
  | 'timeout'
  | 'incompatible'
  | 'corrupt'
  | 'conflict'
  | 'quota'
  | 'transaction'
  | 'closed';

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export interface StoredSnapshot {
  readonly revision: number;
  readonly data: InternshipData;
}

export interface LogDatabase {
  load(): Promise<StoredSnapshot>;
  save(data: unknown, expectedRevision: number): Promise<StoredSnapshot>;
  close(): void;
}

function failure(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  // Browser DOMExceptions and errors from other realms need not satisfy
  // instanceof Error. Inspect only the name, never surface platform details.
  const name =
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
      ? error.name
      : '';
  if (name === 'QuotaExceededError')
    return new StorageError(
      'quota',
      'Browser storage is full. Existing records were not replaced; free space and retry.',
    );
  if (name === 'VersionError')
    return new StorageError(
      'incompatible',
      'This database needs a newer application. Reopen the latest app; do not clear site data.',
    );
  if (name === 'SecurityError' || name === 'NotSupportedError')
    return new StorageError(
      'unavailable',
      'Local storage is unavailable. Check browser permissions or private browsing settings.',
    );
  return new StorageError(
    'transaction',
    'Local storage operation failed. Existing records were not replaced. Retry or reopen the app.',
  );
}

function decodeRecord(value: unknown): StoredSnapshot {
  try {
    const record = readObject(value, ['revision', 'payload'], 'record');
    const revision = integer(
      record.revision,
      'revision',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    if (typeof record.payload !== 'string')
      throw new ValidationError('payload', 'Expected serialized data.');
    return { revision, data: decodeData(record.payload) };
  } catch {
    // Never treat missing/corrupt records as a new empty database.
    throw new StorageError(
      'corrupt',
      'Stored records are missing, invalid, or from an unsupported data version. No records were changed. Keep site data and seek recovery.',
    );
  }
}

function connection(db: IDBDatabase): LogDatabase {
  let closed = false;
  const close = () => {
    closed = true;
    db.close();
  };
  db.onversionchange = close;
  db.onclose = () => {
    closed = true;
  };

  function transact(
    payload?: string,
    expectedRevision?: number,
  ): Promise<StoredSnapshot> {
    if (closed)
      return Promise.reject(
        new StorageError(
          'closed',
          'Storage connection closed. Reopen the app before retrying.',
        ),
      );
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(
          STORE,
          payload === undefined ? 'readonly' : 'readwrite',
        );
      } catch (error) {
        reject(failure(error));
        return;
      }
      let result: StoredSnapshot | undefined;
      let error: unknown;
      tx.onabort = () => {
        reject(failure(error ?? tx.error));
      };
      tx.oncomplete = () => {
        if (result) resolve(result);
        else
          reject(
            new StorageError(
              'transaction',
              'Storage completed without a result. Reopen the app.',
            ),
          );
      };
      const store = tx.objectStore(STORE);
      const request = store.get(KEY);
      request.onsuccess = () => {
        try {
          const current = decodeRecord(request.result);
          result = current;
          if (payload !== undefined) {
            if (current.revision !== expectedRevision)
              throw new StorageError(
                'conflict',
                'Records changed in another tab. Reload the latest records and review your changes before saving again.',
              );
            const revision = integer(
              current.revision + 1,
              'revision',
              1,
              Number.MAX_SAFE_INTEGER,
            );
            result = { revision, data: decodeData(payload) };
            // Queue the write synchronously while this transaction is active.
            // Its promise resolves on commit, never on request success alone.
            store.put({ revision, payload }, KEY);
          }
        } catch (caught) {
          error = caught;
          tx.abort();
        }
      };
    });
  }

  return {
    load: () => transact(),
    async save(data, expectedRevision) {
      integer(expectedRevision, 'revision', 0, Number.MAX_SAFE_INTEGER - 1);
      const payload = encodeData(data);
      return transact(payload, expectedRevision);
    },
    close,
  };
}

export interface OpenDatabaseOptions {
  readonly factory?: IDBFactory;
  readonly name?: string;
  readonly timeoutMs?: number;
}

export function openLogDatabase(
  options: OpenDatabaseOptions = {},
): Promise<LogDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    let settled = false;
    const timeout = setTimeout(() => {
      stop(
        new StorageError(
          'timeout',
          'Opening local storage timed out. Close other app tabs and retry; do not clear site data.',
        ),
      );
    }, options.timeoutMs ?? 10000);
    function stop(error: unknown) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(failure(error));
    }
    try {
      const factory =
        options.factory ??
        (typeof indexedDB === 'undefined' ? undefined : indexedDB);
      if (!factory)
        throw new StorageError(
          'unavailable',
          'IndexedDB is not supported in this browser. Use a browser with local storage support.',
        );
      request = factory.open(options.name ?? DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      stop(error);
      return;
    }
    request.onblocked = () => {
      stop(
        new StorageError(
          'blocked',
          'Another tab is blocking local storage setup. Close other app tabs and retry; do not clear site data.',
        ),
      );
    };
    request.onerror = () => {
      stop(request.error);
    };
    request.onupgradeneeded = (event) => {
      if (settled) {
        request.transaction?.abort();
        return;
      }
      try {
        // There is no released legacy data schema. Future migrations must be
        // explicit and preserve records; never recreate a damaged database.
        if (event.oldVersion !== 0)
          throw new StorageError(
            'incompatible',
            'No migration exists for this database version. Existing data was preserved.',
          );
        const store = request.result.createObjectStore(STORE);
        const initial = store.add(
          { revision: 0, payload: encodeData({ profile: null, entries: [] }) },
          KEY,
        );
        // Preserve the request's useful error (for example quota) before the
        // failed upgrade is reported as a generic AbortError by the open request.
        initial.onerror = () => {
          stop(initial.error);
        };
      } catch (error) {
        request.transaction?.abort();
        stop(error);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // A blocked/timed-out open cannot be cancelled. Close any late result.
      if (settled) {
        db.close();
        return;
      }
      try {
        if (
          db.objectStoreNames.length !== 1 ||
          !db.objectStoreNames.contains(STORE)
        )
          throw new StorageError(
            'incompatible',
            'Local database schema is incompatible. Existing records were preserved.',
          );
        const store = db.transaction(STORE, 'readonly').objectStore(STORE);
        if (store.keyPath !== null || store.autoIncrement)
          throw new StorageError(
            'incompatible',
            'Local database key schema is incompatible. Existing records were preserved.',
          );
        settled = true;
        clearTimeout(timeout);
        resolve(connection(db));
      } catch (error) {
        db.close();
        stop(error);
      }
    };
  });
}
