import { ValidationError } from './model';

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
}

export function requireDate(value: unknown, path: string): string {
  if (!isCalendarDate(value))
    throw new ValidationError(
      path,
      'Use a real calendar date in YYYY-MM-DD format (years 0001–9999).',
    );
  return value;
}

export function mondayOfWeek(value: string): string {
  const date = new Date(`${requireDate(value, 'date')}T00:00:00.000Z`);
  // UTC is used only as calendar arithmetic; never convert to local time.
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
