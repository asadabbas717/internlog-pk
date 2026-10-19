import { describe, expect, it, vi } from 'vitest';
import {
  decodeBackup,
  encodeBackup,
  MAX_BACKUP_BYTES,
} from '../../src/infrastructure/export/backup';
import { readBackupFile } from '../../src/infrastructure/export/files';
import { makeData, makeEntry, makeProfile } from '../fixtures/data';

describe('portable backup boundary', () => {
  it('round-trips complete/empty data and preserves hostile-looking text as data', () => {
    const data = makeData([
      makeEntry(1, {
        description: '<script>never executed</script> پاکستانی =1+1',
      }),
    ]);
    expect(decodeBackup(encodeBackup(data))).toEqual(data);
    expect(decodeBackup(encodeBackup({ profile: null, entries: [] }))).toEqual({
      profile: null,
      entries: [],
    });
    expect(JSON.parse(encodeBackup(data))).toEqual({
      format: 'internlog-pk',
      version: 1,
      ...data,
    });
  });
  it.each([
    '',
    '{',
    'null',
    '[]',
    '{"format":"internlog-pk","version":2,"profile":null,"entries":[]}',
    '{"format":"internlog-pk-data","version":1,"profile":null,"entries":[]}',
    '{"format":"internlog-pk","version":1,"profile":null,"entries":[],"__proto__":{}}',
  ])('rejects malformed, foreign or unexpected envelopes %s', (json) => {
    expect(() => decodeBackup(json)).toThrow();
  });
  it('rejects invalid nested values, duplicate IDs, daily totals and unsafe links', () => {
    for (const data of [
      makeData([makeEntry(), makeEntry()]),
      makeData([makeEntry(1, { referenceUrl: 'javascript:alert(1)' })]),
      makeData([makeEntry(1, { durationMinutes: 1440 }), makeEntry(2)]),
      makeData([makeEntry(1, { date: '2027-01-01' })]),
      { profile: null, entries: [makeEntry()] },
      { profile: { ...makeProfile(), injected: true }, entries: [] },
    ]) {
      expect(() =>
        decodeBackup(
          JSON.stringify({ format: 'internlog-pk', version: 1, ...data }),
        ),
      ).toThrow();
    }
  });
  it('checks bytes before parsing and accepts only data that also fits the storage envelope', () => {
    expect(() => decodeBackup('ا'.repeat(MAX_BACKUP_BYTES / 2 + 1))).toThrow(
      '5 MiB',
    );
    expect(() => decodeBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toThrow(
      '5 MiB',
    );
    const large = makeData(
      Array.from({ length: 1000 }, (_, i) =>
        makeEntry(i + 1, { description: 'ا'.repeat(4000), durationMinutes: 1 }),
      ),
    );
    expect(() => encodeBackup(large)).toThrow('5 MiB');
    expect(() =>
      decodeBackup(
        JSON.stringify({ format: 'internlog-pk', version: 1, ...large }),
      ),
    ).toThrow('5 MiB');
  });
  it('bounds files before reading and reports read/encoding failures without file content', async () => {
    const large = new File(['x'], 'large.json');
    Object.defineProperty(large, 'size', { value: MAX_BACKUP_BYTES + 1 });
    const read = vi.fn();
    Object.defineProperty(large, 'arrayBuffer', { value: read });
    await expect(readBackupFile(large)).rejects.toThrow('5 MiB');
    expect(read).not.toHaveBeenCalled();
    const failed = new File([], 'private-name.json');
    Object.defineProperty(failed, 'arrayBuffer', {
      value: () => Promise.reject(new Error('private contents')),
    });
    await expect(readBackupFile(failed)).rejects.toThrow('Unable to read');
    const invalid = new File([], 'invalid.json');
    Object.defineProperty(invalid, 'arrayBuffer', {
      value: () => Promise.resolve(new Uint8Array([0xff]).buffer),
    });
    await expect(readBackupFile(invalid)).rejects.toThrow('UTF-8');
    const valid = new File([], 'valid.json');
    Object.defineProperty(valid, 'arrayBuffer', {
      value: () =>
        Promise.resolve(
          new TextEncoder().encode(encodeBackup(makeData())).buffer,
        ),
    });
    await expect(readBackupFile(valid)).resolves.toEqual(makeData());
  });
});
