import type { InternshipData, WorkEntry } from './model';
import { ValidationError } from './model';
import { validateData, validateEntry, validateProfile } from './validation';

export function changeProfile(
  data: InternshipData,
  profile: unknown,
): InternshipData {
  return validateData({ ...data, profile: validateProfile(profile) });
}

export function saveEntry(
  data: InternshipData,
  value: unknown,
  mode: 'create' | 'edit',
): InternshipData {
  const entry = validateEntry(value);
  const exists = data.entries.some((item) => item.id === entry.id);
  if (mode === 'create' && exists)
    throw new ValidationError(
      'entry.id',
      'This entry already exists. Reload records before trying again.',
    );
  if (mode === 'edit' && !exists)
    throw new ValidationError(
      'entry.id',
      'This entry no longer exists. Keep your draft, then cancel and add it as new work if appropriate.',
    );
  return validateData({
    ...data,
    entries:
      mode === 'create'
        ? [...data.entries, entry]
        : data.entries.map((item) => (item.id === entry.id ? entry : item)),
  });
}

export function removeEntry(data: InternshipData, id: string): InternshipData {
  if (!data.entries.some((entry) => entry.id === id))
    throw new ValidationError(
      'entry.id',
      'This entry no longer exists. Reload the latest records.',
    );
  return validateData({
    ...data,
    entries: data.entries.filter((entry) => entry.id !== id),
  });
}

export function hasSimilarEntry(
  data: InternshipData,
  candidate: WorkEntry,
): boolean {
  return data.entries.some(
    (entry) =>
      entry.id !== candidate.id &&
      entry.date === candidate.date &&
      entry.durationMinutes === candidate.durationMinutes &&
      entry.description.toLowerCase() === candidate.description.toLowerCase(),
  );
}
