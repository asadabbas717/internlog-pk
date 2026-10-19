import { describe, expect, it } from 'vitest';
import {
  isCalendarDate,
  mondayOfWeek,
  requireDate,
} from '../../src/domain/calendar';
import { LIMITS, ValidationError } from '../../src/domain/model';
import {
  durationMinutes,
  splitDuration,
  summarizeProgress,
} from '../../src/domain/progress';
import {
  integer,
  readObject,
  validateData,
  validateEntry,
  validateProfile,
} from '../../src/domain/validation';
import { makeData, makeEntry, makeProfile } from '../fixtures/data';

describe('calendar-only dates and Monday weeks', () => {
  it.each([
    '0001-01-01',
    '0099-12-31',
    '2000-02-29',
    '2024-02-29',
    '2026-12-31',
    '9999-12-31',
  ])('accepts real calendar date %s', (date) => {
    expect(isCalendarDate(date)).toBe(true);
    expect(requireDate(date, 'date')).toBe(date);
  });
  it.each([
    null,
    20261019,
    '',
    '2026-1-01',
    '2026-01-1',
    '0000-01-01',
    '1900-02-29',
    '2100-02-29',
    '2026-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-01-32',
    '2026-10-19T00:00:00Z',
    ' 2026-10-19',
  ])('rejects invalid calendar value %s', (date) => {
    expect(isCalendarDate(date)).toBe(false);
    expect(() => requireDate(date, 'date')).toThrow(ValidationError);
  });
  it.each([
    ['2026-10-19', '2026-10-19'],
    ['2026-10-25', '2026-10-19'],
    ['2026-10-26', '2026-10-26'],
    ['2026-01-01', '2025-12-29'],
    ['2024-03-03', '2024-02-26'],
    ['0001-01-01', '0001-01-01'],
    ['0099-01-01', '0098-12-29'],
  ])('groups %s under Monday %s', (date, monday) => {
    expect(mondayOfWeek(date)).toBe(monday);
  });
  it('rejects invalid grouping dates', () => {
    expect(() => mondayOfWeek('2026-02-30')).toThrow(ValidationError);
  });
});

describe('strict runtime validation', () => {
  it('supports a complete profile, optional supervisor and same-day internship', () => {
    expect(validateProfile(makeProfile())).toEqual(makeProfile());
    const sameDay = makeProfile({
      startDate: '2026-10-19',
      endDate: '2026-10-19',
      supervisor: 'Sample Supervisor',
      requiredMinutes: 1,
    });
    expect(
      validateData({ profile: sameDay, entries: [makeEntry()] }).profile,
    ).toEqual(sameDay);
    expect(
      validateProfile(makeProfile({ requiredMinutes: LIMITS.requiredMinutes }))
        .requiredMinutes,
    ).toBe(LIMITS.requiredMinutes);
  });
  it.each([
    'studentName',
    'institution',
    'program',
    'organization',
    'supervisor',
  ])('enforces trimmed and bounded profile field %s', (field) => {
    expect(() =>
      validateProfile({ ...makeProfile(), [field]: 'x'.repeat(161) }),
    ).toThrow(ValidationError);
    expect(() =>
      validateProfile({ ...makeProfile(), [field]: ' surrounded ' }),
    ).toThrow(ValidationError);
    expect(() => validateProfile({ ...makeProfile(), [field]: 123 })).toThrow(
      ValidationError,
    );
    if (field !== 'supervisor')
      expect(() => validateProfile({ ...makeProfile(), [field]: '' })).toThrow(
        ValidationError,
      );
    expect(
      validateProfile({ ...makeProfile(), [field]: 'x'.repeat(160) }),
    ).toBeTruthy();
  });
  it.each([
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    '9000',
    600001,
    Number.MAX_SAFE_INTEGER + 1,
  ])('rejects target %s', (requiredMinutes) => {
    expect(() =>
      validateProfile({ ...makeProfile(), requiredMinutes }),
    ).toThrow(ValidationError);
  });
  it('rejects missing, inherited, unexpected fields and reversed profile dates', () => {
    expect(() => validateProfile({})).toThrow(ValidationError);
    const inherited: unknown = Object.create(makeProfile());
    expect(() => validateProfile(inherited)).toThrow(ValidationError);
    expect(() => validateProfile({ ...makeProfile(), extra: true })).toThrow(
      'Unexpected field',
    );
    expect(() =>
      validateProfile(makeProfile({ endDate: '2025-12-31' })),
    ).toThrow('End date');
    expect(() =>
      validateProfile(makeProfile({ startDate: '2026-02-30' })),
    ).toThrow(ValidationError);
    expect(() =>
      validateProfile(makeProfile({ endDate: '2026-13-01' })),
    ).toThrow(ValidationError);
  });
  it.each([undefined, null, 5, [], 'data'])(
    'rejects non-object %s',
    (value) => {
      expect(() => readObject(value, [], 'data')).toThrow(ValidationError);
    },
  );
  it('reports a safe field path without repeating user records in errors', () => {
    try {
      validateEntry({ ...makeEntry(), description: ' confidential ' });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (!(error instanceof ValidationError)) throw error;
      expect(error.path).toBe('entry.description');
      expect(error.message).not.toContain('confidential');
      return;
    }
    throw new Error('Expected invalid entry to fail');
  });
  it.each(['description', 'learningOutcomes'])(
    'enforces required bounded entry text %s',
    (field) => {
      const limit =
        field === 'description' ? LIMITS.description : LIMITS.learningOutcomes;
      for (const value of ['', ' padded ', 4, 'x'.repeat(limit + 1)])
        expect(() => validateEntry({ ...makeEntry(), [field]: value })).toThrow(
          ValidationError,
        );
      expect(
        validateEntry({ ...makeEntry(), [field]: 'x'.repeat(limit) }),
      ).toBeTruthy();
    },
  );
  it.each([
    'bad',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-4000-7000-000000000001',
    'FFFFFFFF-FFFF-4FFF-8FFF-FFFFFFFFFFFF',
    null,
  ])('rejects invalid UUID %s', (id) => {
    expect(() => validateEntry({ ...makeEntry(), id })).toThrow(
      ValidationError,
    );
  });
  it.each([0, -1, 0.5, 1441, NaN, Infinity, '90'])(
    'rejects entry duration %s',
    (duration) => {
      expect(() =>
        validateEntry({ ...makeEntry(), durationMinutes: duration }),
      ).toThrow(ValidationError);
    },
  );
  it.each([
    'https://example.org/work?a=1&b=2#note',
    'http://localhost/reference',
  ])('accepts safe absolute link %s', (referenceUrl) => {
    expect(validateEntry(makeEntry(1, { referenceUrl })).referenceUrl).toBe(
      referenceUrl,
    );
  });
  it.each([
    '',
    '/relative',
    '//example.org',
    'javascript:alert(1)',
    'data:text/html,test',
    'file:///private',
    'https://user:pass@example.org',
    'https://user@example.org',
    'https://',
    'https:example.org',
    'https://example.org/white space',
    'https://example.org/\n',
    'x'.repeat(2049),
    undefined,
    7,
  ])('rejects invalid evidence link %s', (referenceUrl) => {
    expect(() => validateEntry({ ...makeEntry(), referenceUrl })).toThrow(
      ValidationError,
    );
  });
  it('rejects invalid dates and unknown entry fields', () => {
    expect(() => validateEntry({ ...makeEntry(), date: '2026-02-30' })).toThrow(
      ValidationError,
    );
    expect(() => validateEntry({ ...makeEntry(), approved: true })).toThrow(
      ValidationError,
    );
  });
  it('allows empty data but requires a profile before entries', () => {
    expect(validateData({ profile: null, entries: [] })).toEqual({
      profile: null,
      entries: [],
    });
    expect(() =>
      validateData({ profile: null, entries: [makeEntry()] }),
    ).toThrow(ValidationError);
    expect(() => validateData({ profile: null, entries: 'bad' })).toThrow(
      ValidationError,
    );
    expect(() => validateData({ profile: null })).toThrow(ValidationError);
    expect(() =>
      validateData({ profile: null, entries: [], totals: 12 }),
    ).toThrow(ValidationError);
  });
  it('rejects duplicate IDs but permits similar-looking distinct work', () => {
    expect(() => validateData(makeData([makeEntry(), makeEntry()]))).toThrow(
      'unique',
    );
    expect(
      validateData(makeData([makeEntry(1), makeEntry(2)])).entries,
    ).toHaveLength(2);
  });
  it('enforces aggregate daily minutes, including different descriptions', () => {
    expect(
      validateData(
        makeData([
          makeEntry(1, { durationMinutes: 1000 }),
          makeEntry(2, { durationMinutes: 440 }),
        ]),
      ).entries,
    ).toHaveLength(2);
    expect(() =>
      validateData(
        makeData([
          makeEntry(1, { durationMinutes: 1000 }),
          makeEntry(2, { description: 'Different work', durationMinutes: 441 }),
        ]),
      ),
    ).toThrow('24 hours');
  });
  it('rejects out-of-range entries and profile changes that exclude records', () => {
    for (const date of ['2025-12-31', '2027-01-01'])
      expect(() => validateData(makeData([makeEntry(1, { date })]))).toThrow(
        'date range',
      );
    expect(() =>
      validateData({
        ...makeData(),
        profile: makeProfile({ startDate: '2026-10-20' }),
      }),
    ).toThrow('date range');
    expect(
      validateData(
        makeData([
          makeEntry(1, { date: '2026-01-01' }),
          makeEntry(2, { date: '2026-12-31' }),
        ]),
      ).entries,
    ).toHaveLength(2);
  });
  it('rejects excessive and sparse entry arrays', () => {
    expect(() =>
      validateData(
        makeData(Array.from({ length: LIMITS.entries + 1 }, () => makeEntry())),
      ),
    ).toThrow(ValidationError);
    expect(() =>
      validateData({ profile: makeProfile(), entries: new Array(1) }),
    ).toThrow(ValidationError);
  });
  it('does not mutate or retain references to supplied data', () => {
    const input = makeData();
    const validated = validateData(input);
    expect(validated).toEqual(input);
    expect(validated.entries[0]).not.toBe(input.entries[0]);
    expect(validated.profile).not.toBe(input.profile);
  });
});

describe('duration precision and progress', () => {
  it.each([
    [0, 1, 1],
    [1, 1, 61],
    [0, 59, 59],
    [23, 59, 1439],
    [24, 0, 1440],
  ])('converts %s:%s to %s integer minutes', (hours, minutes, total) => {
    expect(durationMinutes(hours, minutes)).toBe(total);
  });
  it.each([
    [0, 0],
    [-1, 30],
    [0.5, 30],
    [25, 0],
    [24, 1],
    [1, 60],
    [1, -1],
    [1, 0.5],
    [NaN, 0],
    [0, Infinity],
  ])('rejects invalid duration %s:%s', (hours, minutes) => {
    expect(() => durationMinutes(hours, minutes)).toThrow(ValidationError);
  });
  it('formats recorded and remaining durations without decimal-hour rounding', () => {
    expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0 });
    expect(splitDuration(9001)).toEqual({ hours: 150, minutes: 1 });
    expect(() => splitDuration(-1)).toThrow(ValidationError);
    expect(() => integer(1.5, 'minutes', 0, 10)).toThrow(ValidationError);
  });
  it('marks incomplete data without inventing a target', () => {
    expect(summarizeProgress({ profile: null, entries: [] })).toEqual({
      recordedMinutes: 0,
      requiredMinutes: null,
      remainingMinutes: null,
      excessMinutes: 0,
      percentage: null,
      workdays: 0,
      incompleteProfile: true,
      weeks: [],
    });
    expect(
      summarizeProgress({ profile: makeProfile(), entries: [] }),
    ).toMatchObject({
      recordedMinutes: 0,
      remainingMinutes: 9000,
      percentage: 0,
      workdays: 0,
      incompleteProfile: false,
    });
  });
  it('derives exact daily and weekly totals in deterministic date/ID order', () => {
    const entries = [
      makeEntry(4, { date: '2026-10-26', durationMinutes: 1 }),
      makeEntry(3, { date: '2026-10-25', durationMinutes: 59 }),
      makeEntry(2, { durationMinutes: 120 }),
      makeEntry(1, { durationMinutes: 61 }),
    ];
    const input = makeData(entries);
    const result = summarizeProgress(input);
    expect(result).toMatchObject({
      recordedMinutes: 241,
      requiredMinutes: 9000,
      remainingMinutes: 8759,
      excessMinutes: 0,
      workdays: 3,
      incompleteProfile: false,
    });
    expect(result.percentage).toBeCloseTo((241 / 9000) * 100);
    expect(result.weeks.map((week) => [week.startDate, week.minutes])).toEqual([
      ['2026-10-19', 240],
      ['2026-10-26', 1],
    ]);
    expect(result.weeks[0]?.days.map((day) => [day.date, day.minutes])).toEqual(
      [
        ['2026-10-19', 181],
        ['2026-10-25', 59],
      ],
    );
    expect(result.weeks[0]?.days[0]?.entries.map((entry) => entry.id)).toEqual([
      makeEntry(1).id,
      makeEntry(2).id,
    ]);
    expect(summarizeProgress(makeData([...entries].reverse()))).toEqual(result);
    expect(input.entries).toEqual(entries);
  });
  it('caps completion, reports excess and refuses invalid source data', () => {
    expect(
      summarizeProgress({
        profile: makeProfile({ requiredMinutes: 60 }),
        entries: [makeEntry(1, { durationMinutes: 61 })],
      }),
    ).toMatchObject({ remainingMinutes: 0, percentage: 100, excessMinutes: 1 });
    expect(() =>
      summarizeProgress(makeData([makeEntry(1, { durationMinutes: -1 })])),
    ).toThrow(ValidationError);
  });
});
