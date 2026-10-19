import { describe, expect, it } from 'vitest';
import {
  changeProfile,
  hasSimilarEntry,
  removeEntry,
  saveEntry,
} from '../../src/domain/mutations';
import { targetMinutes } from '../../src/domain/progress';
import { ValidationError } from '../../src/domain/model';
import { makeData, makeEntry, makeProfile } from '../fixtures/data';
import { wholeNumber } from '../../src/features/forms';

describe('profile and work-log mutations', () => {
  it('creates/updates a profile while preserving entries and checking their dates', () => {
    expect(
      changeProfile({ profile: null, entries: [] }, makeProfile()),
    ).toEqual(makeData([]));
    const data = makeData();
    expect(
      changeProfile(data, makeProfile({ studentName: 'Another Sample' }))
        .entries,
    ).toEqual(data.entries);
    expect(() =>
      changeProfile(data, makeProfile({ endDate: '2026-01-01' })),
    ).toThrow(ValidationError);
    expect(data.profile).toEqual(makeProfile());
  });
  it('creates, edits and removes only the intended work entry', () => {
    const data = makeData();
    const created = saveEntry(data, makeEntry(2), 'create');
    expect(created.entries).toEqual([makeEntry(1), makeEntry(2)]);
    const edited = saveEntry(
      created,
      makeEntry(1, { durationMinutes: 61 }),
      'edit',
    );
    expect(edited.entries).toEqual([
      makeEntry(1, { durationMinutes: 61 }),
      makeEntry(2),
    ]);
    expect(removeEntry(edited, makeEntry(1).id).entries).toEqual([
      makeEntry(2),
    ]);
    expect(data.entries).toEqual([makeEntry(1)]);
  });
  it('does not overwrite duplicate IDs or resurrect a removed entry as an edit', () => {
    expect(() => saveEntry(makeData(), makeEntry(1), 'create')).toThrow(
      'already exists',
    );
    expect(() => saveEntry(makeData([]), makeEntry(1), 'edit')).toThrow(
      'no longer exists',
    );
    expect(() => removeEntry(makeData([]), makeEntry(1).id)).toThrow(
      'no longer exists',
    );
    expect(() =>
      saveEntry(makeData(), makeEntry(2, { durationMinutes: 1440 }), 'create'),
    ).toThrow('24 hours');
  });
  it('detects similar work but ignores the same entry and distinct work', () => {
    expect(
      hasSimilarEntry(
        makeData(),
        makeEntry(2, { description: makeEntry().description.toUpperCase() }),
      ),
    ).toBe(true);
    expect(hasSimilarEntry(makeData(), makeEntry(1))).toBe(false);
    expect(
      hasSimilarEntry(makeData(), makeEntry(2, { date: '2026-10-20' })),
    ).toBe(false);
    expect(
      hasSimilarEntry(makeData(), makeEntry(2, { durationMinutes: 1 })),
    ).toBe(false);
    expect(
      hasSimilarEntry(
        makeData(),
        makeEntry(2, { description: 'Distinct task' }),
      ),
    ).toBe(false);
  });
});

describe('form numeric boundaries', () => {
  it.each([
    '',
    ' ',
    '-1',
    '1.5',
    '1e2',
    '0x10',
    'Infinity',
    '9007199254740992',
  ])('rejects malformed integer %s', (value) => {
    expect(() => wholeNumber(value, 'hours')).toThrow(ValidationError);
  });
  it('accepts digit-only integers and configured targets beyond one day', () => {
    expect(wholeNumber('0001', 'hours')).toBe(1);
    expect(targetMinutes(0, 1)).toBe(1);
    expect(targetMinutes(150, 30)).toBe(9030);
    expect(targetMinutes(10000, 0)).toBe(600000);
  });
  it.each([
    [0, 0],
    [10000, 1],
    [10001, 0],
    [1, 60],
    [0.5, 0],
    [0, -1],
  ])('rejects invalid target %s:%s', (hours, minutes) => {
    expect(() => targetMinutes(hours, minutes)).toThrow(ValidationError);
  });
});
