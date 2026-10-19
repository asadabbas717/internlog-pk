import type { InternshipData } from '../../domain/model';
import { ValidationError } from '../../domain/model';
import { readObject, validateData } from '../../domain/validation';
import { encodeData, MAX_SERIALIZED_BYTES } from '../storage/codec';

export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = MAX_SERIALIZED_BYTES;

function requireSize(json: string) {
  // Code units are a cheap first bound before allocating UTF-8 bytes.
  if (
    json.length > MAX_BACKUP_BYTES ||
    new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES
  )
    throw new ValidationError(
      'backup',
      'Backup exceeds the 5 MiB UTF-8 limit.',
    );
}

export function encodeBackup(value: unknown): string {
  const data = validateData(value);
  encodeData(data); // Every accepted portable backup must also fit local storage.
  const json = JSON.stringify({
    format: 'internlog-pk',
    version: BACKUP_VERSION,
    ...data,
  });
  requireSize(json);
  return json;
}

export function decodeBackup(json: string): InternshipData {
  requireSize(json);
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ValidationError('backup', 'Backup is not valid JSON.');
  }
  const item = readObject(
    value,
    ['format', 'version', 'profile', 'entries'],
    'backup',
  );
  if (item.format !== 'internlog-pk' || item.version !== BACKUP_VERSION)
    throw new ValidationError(
      'backup',
      'Unsupported backup format or version.',
    );
  const data = validateData({ profile: item.profile, entries: item.entries });
  encodeData(data);
  return data;
}
