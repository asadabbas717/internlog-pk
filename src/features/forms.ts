import { ValidationError } from '../domain/model';
import { integer } from '../domain/validation';
import { splitDuration } from '../domain/progress';

export function wholeNumber(value: string, path: string): number {
  if (!/^\d+$/.test(value))
    throw new ValidationError(path, 'Enter a whole number using digits only.');
  return integer(Number(value), path, 0, Number.MAX_SAFE_INTEGER);
}

export function durationLabel(value: number): string {
  const duration = splitDuration(value);
  return `${String(duration.hours)}h ${String(duration.minutes)}m`;
}

export function localToday(): string {
  const date = new Date();
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
