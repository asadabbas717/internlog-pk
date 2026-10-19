import { mondayOfWeek } from './calendar';
import { integer, validateData } from './validation';
import { LIMITS } from './model';
import type { WorkEntry } from './model';

export function durationMinutes(hours: number, minutes: number): number {
  integer(hours, 'hours', 0, 24);
  integer(minutes, 'minutes', 0, 59);
  return integer(
    hours * 60 + minutes,
    'durationMinutes',
    1,
    LIMITS.dailyMinutes,
  );
}

export function splitDuration(minutes: number): {
  hours: number;
  minutes: number;
} {
  integer(minutes, 'durationMinutes', 0, Number.MAX_SAFE_INTEGER);
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

export function targetMinutes(hours: number, minutes: number): number {
  integer(hours, 'requiredHours', 0, LIMITS.requiredMinutes / 60);
  integer(minutes, 'requiredMinutes', 0, 59);
  return integer(
    hours * 60 + minutes,
    'requiredHours',
    1,
    LIMITS.requiredMinutes,
  );
}

export interface DaySummary {
  readonly date: string;
  readonly minutes: number;
  readonly entries: readonly WorkEntry[];
}
export interface WeekSummary {
  readonly startDate: string;
  readonly minutes: number;
  readonly days: readonly DaySummary[];
}

export function summarizeProgress(value: unknown) {
  const data = validateData(value);
  const daily = new Map<string, WorkEntry[]>();
  const ordered = [...data.entries].sort((a, b) =>
    a.date < b.date
      ? -1
      : a.date > b.date
        ? 1
        : a.id < b.id
          ? -1
          : a.id > b.id
            ? 1
            : 0,
  );
  for (const entry of ordered) {
    const existing = daily.get(entry.date);
    if (existing) existing.push(entry);
    else daily.set(entry.date, [entry]);
  }
  const weekly = new Map<string, DaySummary[]>();
  for (const [date, entries] of daily) {
    const day = {
      date,
      entries,
      minutes: entries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
    };
    const monday = mondayOfWeek(date);
    const existing = weekly.get(monday);
    if (existing) existing.push(day);
    else weekly.set(monday, [day]);
  }
  const weeks: WeekSummary[] = Array.from(weekly, ([startDate, days]) => ({
    startDate,
    days,
    minutes: days.reduce((sum, day) => sum + day.minutes, 0),
  }));
  const recordedMinutes = weeks.reduce((sum, week) => sum + week.minutes, 0);
  const requiredMinutes = data.profile?.requiredMinutes ?? null;
  return {
    recordedMinutes,
    requiredMinutes,
    remainingMinutes:
      requiredMinutes === null
        ? null
        : Math.max(0, requiredMinutes - recordedMinutes),
    excessMinutes:
      requiredMinutes === null
        ? 0
        : Math.max(0, recordedMinutes - requiredMinutes),
    percentage:
      requiredMinutes === null
        ? null
        : Math.min(100, (recordedMinutes / requiredMinutes) * 100),
    workdays: daily.size,
    incompleteProfile: data.profile === null,
    weeks,
  };
}
