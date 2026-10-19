import { describe, expect, it } from 'vitest';
import {
  decodeData,
  encodeData,
  MAX_SERIALIZED_BYTES,
} from '../../src/infrastructure/storage/codec';
import { ValidationError } from '../../src/domain/model';
import { makeData, makeEntry, makeProfile } from '../fixtures/data';

describe('bounded internal serialization', () => {
  it('round-trips complete and empty data without executing markup', () => {
    const data = makeData([
      makeEntry(1, {
        description:
          '<script>throw new Error("not code")</script> & Unicode پاکستانی',
        referenceUrl: 'https://example.org/?a=1&b=2',
      }),
    ]);
    expect(decodeData(encodeData(data))).toEqual(data);
    expect(decodeData(encodeData({ profile: null, entries: [] }))).toEqual({
      profile: null,
      entries: [],
    });
  });
  it.each([
    '',
    '{',
    'null',
    '[]',
    '{"format":"internlog-pk-data","version":2,"data":{}}',
    '{"format":"wrong","version":1,"data":{}}',
    '{"format":"internlog-pk-data","version":1,"extra":true,"data":{}}',
    '{"format":"internlog-pk-data","version":1,"data":{"profile":null,"entries":[],"__proto__":{}}}',
  ])('rejects malformed/unknown envelopes: %s', (value) => {
    expect(() => decodeData(value)).toThrow(ValidationError);
  });
  it('rejects oversized bytes before JSON parsing', () => {
    expect(() => decodeData(' '.repeat(MAX_SERIALIZED_BYTES + 1))).toThrow(
      '5 MiB',
    );
    expect(() => decodeData('ا'.repeat(MAX_SERIALIZED_BYTES / 2 + 1))).toThrow(
      '5 MiB',
    );
  });
  it('bounds valid serialized datasets too, including multibyte text', () => {
    const entries = Array.from({ length: 1000 }, (_, index) =>
      makeEntry(index + 1, {
        date: '2026-10-19',
        durationMinutes: 1,
        description: 'ا'.repeat(4000),
      }),
    );
    expect(() => encodeData({ profile: makeProfile(), entries })).toThrow(
      '5 MiB',
    );
    expect(() => encodeData({ profile: null, entries: [makeEntry()] })).toThrow(
      ValidationError,
    );
  });
});
