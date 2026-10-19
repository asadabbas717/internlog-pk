import { requireDate } from './calendar';
import { LIMITS, ValidationError } from './model';
import type { InternshipData, InternshipProfile, WorkEntry } from './model';

export function readObject(
  value: unknown,
  keys: readonly string[],
  path: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new ValidationError(path, 'Expected an object.');
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (!keys.includes(key))
      throw new ValidationError(path, 'Unexpected field.');
  }
  // Read only own properties; inherited values must never fill required fields.
  for (const key of keys) {
    if (Object.hasOwn(value, key)) result[key] = Reflect.get(value, key);
  }
  return result;
}

function text(
  value: unknown,
  path: string,
  maximum: number,
  optional = false,
): string {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    value.length > maximum ||
    (!optional && value.length === 0)
  )
    throw new ValidationError(
      path,
      `Use ${optional ? '0' : '1'}–${String(maximum)} characters without surrounding whitespace.`,
    );
  return value;
}

export function integer(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  )
    throw new ValidationError(
      path,
      `Use a whole number from ${String(minimum)} to ${String(maximum)}.`,
    );
  return value;
}

export function validateProfile(value: unknown): InternshipProfile {
  const item = readObject(
    value,
    [
      'studentName',
      'institution',
      'program',
      'organization',
      'supervisor',
      'startDate',
      'endDate',
      'requiredMinutes',
    ],
    'profile',
  );
  const startDate = requireDate(item.startDate, 'profile.startDate');
  const endDate = requireDate(item.endDate, 'profile.endDate');
  if (endDate < startDate)
    throw new ValidationError(
      'profile.endDate',
      'End date must be on or after start date.',
    );
  return {
    studentName: text(item.studentName, 'profile.studentName', LIMITS.name),
    institution: text(item.institution, 'profile.institution', LIMITS.name),
    program: text(item.program, 'profile.program', LIMITS.name),
    organization: text(item.organization, 'profile.organization', LIMITS.name),
    supervisor: text(item.supervisor, 'profile.supervisor', LIMITS.name, true),
    startDate,
    endDate,
    requiredMinutes: integer(
      item.requiredMinutes,
      'profile.requiredMinutes',
      1,
      LIMITS.requiredMinutes,
    ),
  };
}

function reference(value: unknown, path: string): string {
  const link = text(value, path, LIMITS.url);
  try {
    const url = new URL(link);
    if (
      !/^https?:\/\//i.test(link) ||
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      /\s/.test(link)
    )
      throw new Error('Unsafe URL');
  } catch {
    throw new ValidationError(
      path,
      'Use an absolute HTTP or HTTPS URL without credentials or whitespace.',
    );
  }
  return link;
}

export function validateEntry(value: unknown, path = 'entry'): WorkEntry {
  const item = readObject(
    value,
    [
      'id',
      'date',
      'description',
      'learningOutcomes',
      'durationMinutes',
      'referenceUrl',
    ],
    path,
  );
  if (
    typeof item.id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      item.id,
    )
  )
    throw new ValidationError(
      `${path}.id`,
      'Use a lowercase UUID with a valid version and variant.',
    );
  return {
    id: item.id,
    date: requireDate(item.date, `${path}.date`),
    description: text(
      item.description,
      `${path}.description`,
      LIMITS.description,
    ),
    learningOutcomes: text(
      item.learningOutcomes,
      `${path}.learningOutcomes`,
      LIMITS.learningOutcomes,
    ),
    durationMinutes: integer(
      item.durationMinutes,
      `${path}.durationMinutes`,
      1,
      LIMITS.dailyMinutes,
    ),
    ...(Object.hasOwn(item, 'referenceUrl')
      ? { referenceUrl: reference(item.referenceUrl, `${path}.referenceUrl`) }
      : {}),
  };
}

export function validateData(value: unknown): InternshipData {
  const item = readObject(value, ['profile', 'entries'], 'data');
  const profile = item.profile === null ? null : validateProfile(item.profile);
  if (!Array.isArray(item.entries) || item.entries.length > LIMITS.entries)
    throw new ValidationError(
      'entries',
      `Use an array of at most ${String(LIMITS.entries)} entries.`,
    );
  const entries = Array.from(item.entries, (entry: unknown, index) =>
    validateEntry(entry, `entries.${String(index)}`),
  );
  if (!profile && entries.length > 0)
    throw new ValidationError(
      'profile',
      'Create a complete profile before recording work.',
    );
  const ids = new Set<string>();
  const daily = new Map<string, number>();
  for (const [index, entry] of entries.entries()) {
    if (ids.has(entry.id))
      throw new ValidationError(
        `entries.${String(index)}.id`,
        'Entry IDs must be unique.',
      );
    ids.add(entry.id);
    if (
      profile &&
      (entry.date < profile.startDate || entry.date > profile.endDate)
    )
      throw new ValidationError(
        `entries.${String(index)}.date`,
        'Work date must be inside the internship date range.',
      );
    const minutes = (daily.get(entry.date) ?? 0) + entry.durationMinutes;
    if (minutes > LIMITS.dailyMinutes)
      throw new ValidationError(
        `entries.${String(index)}.durationMinutes`,
        'Total work on one date cannot exceed 24 hours.',
      );
    daily.set(entry.date, minutes);
  }
  return { profile, entries };
}
