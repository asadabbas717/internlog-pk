import { useState } from 'react';
import type { InternshipProfile } from '../../domain/model';
import { LIMITS } from '../../domain/model';
import { splitDuration, targetMinutes } from '../../domain/progress';
import { validateProfile } from '../../domain/validation';
import { describeIssue } from '../../app/useLogbook';
import type { SaveResult } from '../../app/useLogbook';
import { EditorForm, fieldError, formIssue } from '../../components/EditorForm';
import type { FormIssue } from '../../components/EditorForm';
import { TextField } from '../../components/TextField';
import { wholeNumber } from '../forms';

const textFields = [
  ['studentName', 'Student name'],
  ['institution', 'University or institution'],
  ['program', 'Degree or program'],
  ['organization', 'Host organization'],
  ['supervisor', 'Supervisor name'],
] as const;

interface Props {
  initial: InternshipProfile | null;
  busy: boolean;
  needsRefresh: boolean;
  onSave: (profile: InternshipProfile) => Promise<SaveResult>;
  onCancel?: (() => void) | undefined;
}

export function ProfileForm({
  initial,
  busy,
  needsRefresh,
  onSave,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(() => {
    const target = splitDuration(initial?.requiredMinutes ?? 9000);
    return {
      studentName: initial?.studentName ?? '',
      institution: initial?.institution ?? '',
      program: initial?.program ?? '',
      organization: initial?.organization ?? '',
      supervisor: initial?.supervisor ?? '',
      startDate: initial?.startDate ?? '',
      endDate: initial?.endDate ?? '',
      requiredHours: String(target.hours),
      requiredMinutes: String(target.minutes),
    };
  });
  const [dirty, setDirty] = useState(false);
  const [issue, setIssue] = useState<FormIssue | null>(null);
  function change(field: keyof typeof draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setDirty(true);
    setIssue(null);
  }
  async function submit() {
    try {
      const profile = validateProfile({
        studentName: draft.studentName.trim(),
        institution: draft.institution.trim(),
        program: draft.program.trim(),
        organization: draft.organization.trim(),
        supervisor: draft.supervisor.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate,
        requiredMinutes: targetMinutes(
          wholeNumber(draft.requiredHours, 'requiredHours'),
          wholeNumber(draft.requiredMinutes, 'requiredMinutes'),
        ),
      });
      const result = await onSave(profile);
      if (!result.ok && result.issue.code === 'validation')
        setIssue(formIssue(result.issue));
    } catch (error) {
      setIssue(formIssue(describeIssue(error)));
    }
  }
  return (
    <EditorForm
      id="profile"
      title={initial ? 'Edit internship profile' : 'Set up your internship'}
      focusOnMount={Boolean(initial)}
      dirty={dirty}
      busy={busy}
      issue={issue}
      submitDisabled={needsRefresh}
      submitLabel="Save profile"
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div className="form-grid">
        {textFields.map(([field, label]) => (
          <TextField
            key={field}
            id={`profile-${field}`}
            label={label}
            value={draft[field]}
            onChange={(value) => {
              change(field, value);
            }}
            required={field !== 'supervisor'}
            maxLength={LIMITS.name}
            error={fieldError(issue, field)}
          />
        ))}
      </div>
      <div className="form-grid">
        <TextField
          id="profile-startDate"
          label="Internship start date"
          type="date"
          value={draft.startDate}
          onChange={(value) => {
            change('startDate', value);
          }}
          required
          error={fieldError(issue, 'startDate')}
        />
        <TextField
          id="profile-endDate"
          label="Internship end date"
          type="date"
          value={draft.endDate}
          onChange={(value) => {
            change('endDate', value);
          }}
          required
          error={fieldError(issue, 'endDate')}
        />
      </div>
      <p className="field-hint">
        Set your own target. 150 hours is an editable example, not a universal
        university requirement.
      </p>
      <div className="form-grid">
        <TextField
          id="profile-requiredHours"
          label="Required hours"
          type="number"
          min={0}
          max={LIMITS.requiredMinutes / 60}
          step={1}
          value={draft.requiredHours}
          onChange={(value) => {
            change('requiredHours', value);
          }}
          required
          error={fieldError(issue, 'requiredHours')}
        />
        <TextField
          id="profile-requiredMinutes"
          label="Additional required minutes"
          type="number"
          min={0}
          max={59}
          step={1}
          value={draft.requiredMinutes}
          onChange={(value) => {
            change('requiredMinutes', value);
          }}
          required
          error={fieldError(issue, 'requiredMinutes')}
        />
      </div>
    </EditorForm>
  );
}
