import type { InternshipData } from '../../domain/model';
import { ValidationError } from '../../domain/model';
import { readObject, validateData } from '../../domain/validation';

export const DATA_VERSION = 1;
export const MAX_SERIALIZED_BYTES = 5 * 1024 * 1024;

export function encodeData(value: unknown): string {
  const data = validateData(value);
  const json = JSON.stringify({
    format: 'internlog-pk-data',
    version: DATA_VERSION,
    data,
  });
  requireSize(json);
  return json;
}

function requireSize(json: string) {
  if (new TextEncoder().encode(json).byteLength > MAX_SERIALIZED_BYTES)
    throw new ValidationError('data', 'Dataset exceeds the 5 MiB UTF-8 limit.');
}

export function decodeData(json: string): InternshipData {
  requireSize(json);
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ValidationError('data', 'Stored data is not valid JSON.');
  }
  const item = readObject(value, ['format', 'version', 'data'], 'envelope');
  if (item.format !== 'internlog-pk-data' || item.version !== DATA_VERSION)
    throw new ValidationError(
      'envelope',
      'Unsupported data format or version.',
    );
  return validateData(item.data);
}
