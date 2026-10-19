import type {
  InternshipData,
  InternshipProfile,
  WorkEntry,
} from '../../src/domain/model';

export function makeProfile(
  overrides: Partial<InternshipProfile> = {},
): InternshipProfile {
  return {
    studentName: 'Sample Student',
    institution: 'Example University',
    program: 'BS Computer Science',
    organization: 'Example Software',
    supervisor: '',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    requiredMinutes: 9000,
    ...overrides,
  };
}

export function makeEntry(
  index = 1,
  overrides: Partial<WorkEntry> = {},
): WorkEntry {
  return {
    id: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`,
    date: '2026-10-19',
    description: 'Implemented and tested a sample form.',
    learningOutcomes: 'Accessible form validation',
    durationMinutes: 90,
    ...overrides,
  };
}

export function makeData(
  entries: readonly WorkEntry[] = [makeEntry()],
): InternshipData {
  return { profile: makeProfile(), entries };
}
