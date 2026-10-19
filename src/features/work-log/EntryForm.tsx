import { useState } from 'react';
import type {
  InternshipData,
  InternshipProfile,
  WorkEntry,
} from '../../domain/model';
import { LIMITS } from '../../domain/model';
import { durationMinutes, splitDuration } from '../../domain/progress';
import { validateEntry } from '../../domain/validation';
import { hasSimilarEntry } from '../../domain/mutations';
import { describeIssue } from '../../app/useLogbook';
import type { SaveResult } from '../../app/useLogbook';
import { EditorForm, fieldError, formIssue } from '../../components/EditorForm';
import type { FormIssue } from '../../components/EditorForm';
import { TextField } from '../../components/TextField';
import { localToday, wholeNumber } from '../forms';

interface Props {
  initial: WorkEntry | null;
  profile: InternshipProfile;
  data: InternshipData;
  busy: boolean;
  needsRefresh: boolean;
  onSave: (entry: WorkEntry) => Promise<SaveResult>;
  onCancel: () => void;
}

export function EntryForm({
  initial,
  profile,
  data,
  busy,
  needsRefresh,
  onSave,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(() => {
    const duration = splitDuration(initial?.durationMinutes ?? 0);
    const today = localToday();
    return {
      date:
        initial?.date ??
        (today >= profile.startDate && today <= profile.endDate
          ? today
          : profile.startDate),
      description: initial?.description ?? '',
      learningOutcomes: initial?.learningOutcomes ?? '',
      hours: String(duration.hours),
      minutes: String(duration.minutes),
      referenceUrl: initial?.referenceUrl ?? '',
    };
  });
  const [dirty, setDirty] = useState(false);
  const [issue, setIssue] = useState<FormIssue | null>(null);
  const [similar, setSimilar] = useState(false);
  function report(error: FormIssue) {
    setIssue(
      error.field === 'durationMinutes' ? { ...error, field: 'hours' } : error,
    );
  }
  function change(field: keyof typeof draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setDirty(true);
    setIssue(null);
    setSimilar(false);
  }
  async function submit() {
    try {
      const link = draft.referenceUrl.trim();
      const entry = validateEntry({
        id: initial?.id ?? crypto.randomUUID(),
        date: draft.date,
        description: draft.description.trim(),
        learningOutcomes: draft.learningOutcomes.trim(),
        durationMinutes: durationMinutes(
          wholeNumber(draft.hours, 'hours'),
          wholeNumber(draft.minutes, 'minutes'),
        ),
        ...(link ? { referenceUrl: link } : {}),
      });
      if (!similar && hasSimilarEntry(data, entry)) {
        setSimilar(true);
        return;
      }
      const result = await onSave(entry);
      if (!result.ok && result.issue.code === 'validation')
        report(formIssue(result.issue));
    } catch (error) {
      report(formIssue(describeIssue(error)));
    }
  }
  return (
    <EditorForm
      id="entry"
      title={initial ? 'Edit work entry' : 'Add a work entry'}
      dirty={dirty}
      busy={busy}
      issue={issue}
      submitDisabled={needsRefresh}
      submitLabel={
        similar
          ? 'Save distinct entry'
          : initial
            ? 'Save changes'
            : 'Save entry'
      }
      onSubmit={submit}
      onCancel={onCancel}
    >
      <p className="field-hint">
        Record work you actually completed. Do not include confidential
        organization information.
      </p>
      <TextField
        id="entry-date"
        label="Work date"
        type="date"
        value={draft.date}
        onChange={(value) => {
          change('date', value);
        }}
        min={profile.startDate}
        max={profile.endDate}
        required
        error={fieldError(issue, 'date')}
      />
      <TextField
        id="entry-description"
        label="Work performed"
        multiline
        value={draft.description}
        onChange={(value) => {
          change('description', value);
        }}
        required
        maxLength={LIMITS.description}
        error={fieldError(issue, 'description')}
      />
      <div className="form-grid">
        <TextField
          id="entry-hours"
          label="Hours worked"
          type="number"
          min={0}
          max={24}
          step={1}
          value={draft.hours}
          onChange={(value) => {
            change('hours', value);
          }}
          required
          error={fieldError(issue, 'hours')}
        />
        <TextField
          id="entry-minutes"
          label="Minutes worked"
          type="number"
          min={0}
          max={59}
          step={1}
          value={draft.minutes}
          onChange={(value) => {
            change('minutes', value);
          }}
          required
          error={fieldError(issue, 'minutes')}
        />
      </div>
      <TextField
        id="entry-learningOutcomes"
        label="Skills or learning outcomes"
        multiline
        value={draft.learningOutcomes}
        onChange={(value) => {
          change('learningOutcomes', value);
        }}
        required
        maxLength={LIMITS.learningOutcomes}
        error={fieldError(issue, 'learningOutcomes')}
      />
      <TextField
        id="entry-referenceUrl"
        label="Evidence link"
        type="url"
        value={draft.referenceUrl}
        onChange={(value) => {
          change('referenceUrl', value);
        }}
        maxLength={LIMITS.url}
        hint="Use a public, nonconfidential HTTP(S) reference. Links open in a new tab."
        error={fieldError(issue, 'referenceUrl')}
      />
      {similar && (
        <p className="notice" role="status">
          An entry on this date has the same description and duration. If this
          is distinct work, choose Save distinct entry.
        </p>
      )}
    </EditorForm>
  );
}
