export interface InternshipProfile {
  readonly studentName: string;
  readonly institution: string;
  readonly program: string;
  readonly organization: string;
  readonly supervisor: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly requiredMinutes: number;
}

export interface WorkEntry {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly learningOutcomes: string;
  readonly durationMinutes: number;
  readonly referenceUrl?: string;
}

export interface InternshipData {
  readonly profile: InternshipProfile | null;
  readonly entries: readonly WorkEntry[];
}

export const LIMITS = {
  name: 160,
  description: 4000,
  learningOutcomes: 2000,
  url: 2048,
  dailyMinutes: 1440,
  requiredMinutes: 600000,
  entries: 10000,
} as const;

export class ValidationError extends Error {
  constructor(
    public readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
